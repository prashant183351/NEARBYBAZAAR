import { Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Cart, ICartItem } from '../models/Cart';
import { Address } from '../models/Address';
import { StockReservation } from '../models/StockReservation';
import { PaymentGateway, PaymentStatus, PaymentIntent } from '../models/PaymentIntent';
import { Order } from '../models/Order';
import { awardPoints } from '../services/loyalty';
import { Shipment, ShipmentStatus } from '../models/Shipment';
import { isHighRiskBuyer } from '../services/buyerRisk';
import { EscrowRecord, createEscrow } from '../services/payments/escrow';

// Helpers
function getSessionId(req: Request): string {
  const header = (req.headers['x-session-id'] as string) || '';
  if (header && header.length > 6) return header;
  const sid = new Types.ObjectId().toHexString();
  // Reflect back for client to persist
  req.res?.setHeader('X-Session-Id', sid);
  return sid;
}

function getUserIdOrAnonymous(req: Request): Types.ObjectId {
  const user = (req as any).user as { id: string } | undefined;
  if (user?.id) return new Types.ObjectId(user.id);
  // Anonymous placeholder user id for guest checkout
  return new Types.ObjectId();
}

// Zod Schemas
export const AddToCartBody = z.object({
  itemId: z.string().min(1),
  itemType: z.enum(['product', 'service']),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  price: z.number().min(0),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
});

export const SetAddressBody = z.object({
  shippingAddressId: z.string().optional(),
  billingAddressId: z.string().optional(),
  // Inline address for guest
  shippingAddress: z
    .object({
      fullName: z.string(),
      phone: z.string(),
      addressLine1: z.string(),
      addressLine2: z.string().optional(),
      landmark: z.string().optional(),
      city: z.string(),
      state: z.string(),
      pincode: z.string(),
      country: z.string().default('IN'),
    })
    .optional(),
});

export const ShippingBody = z.object({
  selectOption: z
    .object({ code: z.string(), label: z.string(), cost: z.number().min(0) })
    .optional(),
});

export const PayBody = z.object({
  gateway: z.nativeEnum(PaymentGateway).default(PaymentGateway.PHONEPE),
});

export const ConfirmBody = z.object({
  paymentIntentId: z.string().min(8),
  // For tests/sandbox only: allow simulating success
  simulateSuccess: z.boolean().optional(),
});

// Controllers
export const getCart = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id ? new Types.ObjectId((req as any).user.id) : undefined;
  const sessionId = userId ? undefined : getSessionId(req);
  const cart = await (Cart as any).findOrCreate(userId, sessionId);
  return res.json({ success: true, data: cart });
};

export const addToCart = async (req: Request, res: Response) => {
  const parsed = AddToCartBody.parse(req.body);
  const userId = (req as any).user?.id ? new Types.ObjectId((req as any).user.id) : undefined;
  const sessionId = userId ? undefined : getSessionId(req);
  const cart = await (Cart as any).findOrCreate(userId, sessionId);

  const item: ICartItem = {
    itemId: new Types.ObjectId(parsed.itemId),
    itemType: parsed.itemType,
    variantId: parsed.variantId,
    quantity: parsed.quantity,
    price: parsed.price,
    discount: parsed.discount,
    tax: parsed.tax,
  } as any;
  await (cart as any).addItem(item);
  return res.status(201).json({ success: true, data: cart });
};

export const setAddress = async (req: Request, res: Response) => {
  const parsed = SetAddressBody.parse(req.body);
  const userId = (req as any).user?.id ? new Types.ObjectId((req as any).user.id) : undefined;
  const sessionId = userId ? undefined : getSessionId(req);
  const cart = await (Cart as any).findOrCreate(userId, sessionId);

  if (parsed.shippingAddressId) {
    cart.shippingAddressId = new Types.ObjectId(parsed.shippingAddressId);
  } else if (parsed.shippingAddress && userId) {
    const created = await Address.create({
      userId,
      type: 'SHIPPING',
      ...parsed.shippingAddress,
      isDefault: false,
    } as any);
    cart.shippingAddressId = created._id as Types.ObjectId;
  } else if (parsed.shippingAddress && !userId) {
    // Store inline for guest in metadata
    (cart as any).metadata = {
      ...(cart as any).metadata,
      guestShippingAddress: parsed.shippingAddress,
    };
  }

  if (parsed.billingAddressId) {
    cart.billingAddressId = new Types.ObjectId(parsed.billingAddressId);
  }

  await cart.save();
  return res.json({ success: true, data: cart });
};

type ShippingOption = { code: string; label: string; cost: number; etaDays: number };
function computeShippingOptions(_cartTotal: number): ShippingOption[] {
  // Simple flat options; later integrate couriers
  return [
    { code: 'standard', label: 'Standard (3-5 days)', cost: 50, etaDays: 5 },
    { code: 'express', label: 'Express (1-2 days)', cost: 150, etaDays: 2 },
  ];
}

export const shipping = async (req: Request, res: Response) => {
  const parsed = ShippingBody.parse(req.body || {});
  const userId = (req as any).user?.id ? new Types.ObjectId((req as any).user.id) : undefined;
  const sessionId = userId ? undefined : getSessionId(req);
  const cart = await (Cart as any).findOrCreate(userId, sessionId);

  const options = computeShippingOptions((cart as any).total || 0);
  if (!parsed.selectOption) {
    return res.json({ success: true, data: { options } });
  }

  // Persist chosen option in cart metadata
  (cart as any).metadata = {
    ...(cart as any).metadata,
    shippingOption: parsed.selectOption,
  };
  await cart.save();
  return res.json({ success: true, data: { selected: parsed.selectOption } });
};

export const pay = async (req: Request, res: Response) => {
  const { gateway } = PayBody.parse(req.body || {});
  const userId = getUserIdOrAnonymous(req);
  const sessionId = (req as any).user?.id ? undefined : getSessionId(req);
  const cart = await (Cart as any).findOrCreate((req as any).user?.id ? userId : undefined, sessionId);

  if (!cart.items || cart.items.length === 0) {
    return res.status(400).json({ success: false, error: { message: 'Cart is empty' } });
  }

  const shippingCost = (cart as any).metadata?.shippingOption?.cost || 0;
  const amount = (cart.total || 0) + shippingCost;

  // Reserve stock for each product item (best-effort; ignore services)
  for (const item of cart.items) {
    if (item.itemType === 'product') {
      try {
        await (StockReservation as any).reserveStock(
          new Types.ObjectId(item.itemId),
          item.quantity,
          userId,
          { variantId: item.variantId }
        );
      } catch (err) {
        req.log?.warn({ err }, 'Failed to reserve stock');
      }
    }
  }

  const pi = await PaymentIntent.create({
    orderId: new Types.ObjectId(), // placeholder until confirm
    userId,
    amount,
    currency: 'INR',
    status: PaymentStatus.PENDING,
    gateway,
    capturedAmount: 0,
    refundedAmount: 0,
  });

  // If high-risk, hold funds in escrow until delivery
  let escrow: EscrowRecord | undefined;
  if (await isHighRiskBuyer(userId.toString())) {
    escrow = createEscrow(cart._id, amount);
    // TODO: Save escrow record to DB
  }

  return res.status(201).json({ success: true, data: { paymentIntent: pi, escrow } });
};

export const confirm = async (req: Request, res: Response) => {
  const { paymentIntentId, simulateSuccess } = ConfirmBody.parse(req.body);

  const pi = await PaymentIntent.findOne({ paymentIntentId });
  if (!pi) return res.status(404).json({ success: false, error: { message: 'PaymentIntent not found' } });

  // In real flow, verify gateway webhook or capture status; here support simulation
  if (simulateSuccess && (pi.status === PaymentStatus.PENDING || pi.status === PaymentStatus.PROCESSING)) {
    pi.status = PaymentStatus.SUCCEEDED;
    pi.capturedAmount = pi.amount;
    await pi.save();
  }

  if (pi.status !== PaymentStatus.SUCCEEDED && pi.status !== PaymentStatus.REQUIRES_CAPTURE) {
    return res.status(400).json({ success: false, error: { message: 'Payment not completed' } });
  }

  const userId = pi.userId;
  // Retrieve cart (user or session not stored; we just create order from PI amount and pretend lines)
  // Better: derive from reservations or stash snapshot in PI metadata. For now, fetch latest cart for user.
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart || !cart.items?.length) {
    return res.status(400).json({ success: false, error: { message: 'No cart to confirm' } });
  }

  const items = cart.items.map((i: any) => ({
    product: i.itemId,
    quantity: i.quantity,
    price: i.price,
    total: i.price * i.quantity,
  }));
  const order = await Order.create({
    user: userId,
    status: 'confirmed',
    items,
    subtotal: cart.subtotal,
    tax: cart.tax,
    total: cart.total + ((cart as any).metadata?.shippingOption?.cost || 0),
    currency: 'INR',
  } as any);

  // Update PI with actual order id
  pi.orderId = order._id as Types.ObjectId;
  if (pi.status === PaymentStatus.REQUIRES_CAPTURE) {
    pi.status = PaymentStatus.SUCCEEDED;
    pi.capturedAmount = pi.amount;
  }
  await pi.save();

  // Confirm reservations
  try {
    await (StockReservation as any).updateMany(
      { userId, status: 'reserved' },
      { $set: { status: 'confirmed', orderId: order._id, confirmedAt: new Date() } }
    );
  } catch (err) {
    req.log?.warn({ err }, 'Failed to confirm some reservations');
  }

  // Create a shipment stub
  const shipment = await Shipment.create({
    orderId: order._id,
    status: ShipmentStatus.PENDING,
    carrier: 'Manual',
    trackingNumber: undefined,
    shippingAddress: (cart as any).metadata?.guestShippingAddress || undefined,
  } as any);

  // Clear the cart
  await Cart.deleteOne({ _id: (cart as any)._id });

  // Award loyalty points for purchase
  try {
    await awardPoints({
      userId,
      action: 'purchase',
      points: Math.floor(order.total / 100), // 1 point per ₹100 spent
      refId: order._id as Types.ObjectId,
      meta: { orderId: order._id }
    });
  } catch (err) {
    req.log?.warn({ err }, 'Failed to award loyalty points');
  }
  return res.json({ success: true, data: { order, paymentIntent: pi, shipment } });
};

// Payment method selection endpoint
export const selectPaymentMethod = async (req: Request, res: Response) => {
  const { buyerId, paymentMethod, orderId, orderTotal } = req.body;
  if (paymentMethod === 'COD' && await isHighRiskBuyer(buyerId.toString())) {
    return res.status(403).json({ error: 'COD not allowed for high-risk buyers. Please use prepaid or verified payment.' });
  }
  let escrow;
  if (await isHighRiskBuyer(buyerId.toString())) {
    escrow = createEscrow(orderId, orderTotal);
    // TODO: Save escrow record to DB
  }
  res.json({ success: true, escrow });
};
