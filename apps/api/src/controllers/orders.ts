import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Order, OrderZ } from '../models/Order';
import { Product } from '../models/Product';
import { buildWarrantySnapshot, resolveWarrantyStatus, scheduleWarrantyExpiryReminder } from '../services/warranty';
import { calculateCommission } from '../services/commission/calc';

export async function createOrder(req: Request, res: Response) {
    const parse = OrderZ.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.errors });
    const orderData: any = parse.data;

    const productIds = Array.from(new Set((orderData.items || []).map((item: any) => item.product))) as string[];
    // Removed unused productObjectIds
    const products = productIds.length ? await Product.find({ _id: { $in: productIds } }).select('vendor warranty').lean() : [];
    const productMap = new Map<string, any>(products.map((doc) => [String(doc._id), doc]));

    const purchaseDate = new Date();

    orderData.items = await Promise.all(
        (orderData.items || []).map(async (line: any) => {
            const productDoc = productMap.get(line.product);
            if (productDoc) {
                const warrantySnapshot = buildWarrantySnapshot(productDoc, purchaseDate);
                if (warrantySnapshot) {
                    line.warranty = warrantySnapshot;
                }
                if (!orderData.vendor && productDoc.vendor) {
                    orderData.vendor = productDoc.vendor;
                }
            }

            const commissionInput = {
                price: line.price,
                category: line.category,
                vendorId: productDoc?.vendor ? String(productDoc.vendor) : undefined,
                quantity: line.quantity || 1,
            };
            const commissionResult = await calculateCommission(commissionInput);
            line.commission = commissionResult.commission;
            line.commissionBreakdown = commissionResult.breakdown;

            return line;
        })
    );

    const order = await Order.create(orderData);

    for (const item of order.items as any[]) {
        if (item.warranty?.expiryDate) {
            await scheduleWarrantyExpiryReminder({
                orderId: order._id as Types.ObjectId,
                lineItemId: item._id,
                userId: order.user as Types.ObjectId,
                warranty: item.warranty,
            });
        }
    }

    res.status(201).json({ order });
}

export async function listOrders(req: Request, res: Response) {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await Order.find({ user: new Types.ObjectId(user.id), deleted: false })
        .sort({ createdAt: -1 })
        .lean();

    const now = new Date();
    const enriched = orders.map((order) => ({
        ...order,
        items: (order.items || []).map((item: any) => {
            if (item.warranty) {
                const status = resolveWarrantyStatus(item.warranty, now);
                return { ...item, warranty: { ...item.warranty, status } };
            }
            return item;
        }),
    }));

    res.json({ orders: enriched });
}

// More logic to be added in later chunks
