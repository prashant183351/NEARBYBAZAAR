import { Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Order } from '../models/Order';
import { WarrantyClaim } from '../models/WarrantyClaim';
import { emailQueue } from '../queues';
import { resolveWarrantyStatus } from '../services/warranty';

const CreateWarrantyClaimSchema = z.object({
  orderId: z.string().min(1),
  lineItemId: z.string().min(1),
  issueDescription: z.string().min(10),
  preferredContact: z.string().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

export async function createWarrantyClaim(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const parsed = CreateWarrantyClaimSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

  const { orderId, lineItemId, issueDescription, preferredContact, attachments } = parsed.data;

  const order = await Order.findOne({
    _id: new Types.ObjectId(orderId),
    user: new Types.ObjectId(user.id),
    deleted: false,
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const line: any = (order as any).items.id(lineItemId);
  if (!line) return res.status(404).json({ error: 'Order item not found' });

  if (!line.warranty) return res.status(400).json({ error: 'No warranty available for this item' });

  const status = resolveWarrantyStatus(line.warranty);
  if (status === 'expired') return res.status(400).json({ error: 'Warranty already expired' });

  const existing = await WarrantyClaim.findOne({
    orderId: order._id,
    lineItemId: line._id,
    status: { $in: ['pending', 'in_review'] },
  });
  if (existing) return res.status(409).json({ error: 'Warranty claim already in progress' });

  const claim = await WarrantyClaim.create({
    orderId: order._id,
    lineItemId: line._id,
    productId: line.product,
    userId: order.user,
    vendorId: (order as any).vendor,
    issueDescription,
    preferredContact,
    attachments,
    warrantySnapshot: line.warranty,
  });

  line.warranty.status = 'claimed';
  (order as any).markModified('items');
  await order.save();

  const orderIdHex = (order._id as Types.ObjectId).toHexString();
  const lineItemIdHex = (line._id as Types.ObjectId).toHexString();
  const claimIdHex = (claim._id as Types.ObjectId).toHexString();
  const vendorIdHex = (order as any).vendor
    ? ((order as any).vendor as Types.ObjectId).toHexString()
    : undefined;
  const userIdHex = (order.user as Types.ObjectId).toHexString();

  await emailQueue.add('warranty.claim', {
    orderId: orderIdHex,
    lineItemId: lineItemIdHex,
    claimId: claimIdHex,
    issueDescription,
    userId: userIdHex,
    vendorId: vendorIdHex,
  });

  res.status(201).json({ claim });
}

export async function listMyWarrantyClaims(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const claims = await WarrantyClaim.find({ userId: new Types.ObjectId(user.id) })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ claims });
}
