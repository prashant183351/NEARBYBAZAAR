import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { AuditLog } from '../models/AuditLog';
import { PaymentIntent, PaymentStatus } from '../models/PaymentIntent';
import { CommissionLedger } from '../models/CommissionLedger';
import { Types } from 'mongoose';

// Refund handler: adjust commissions
export async function refundOrder(req: Request, res: Response) {
  const { orderId, refundAmount, lineItemId, reason } = req.body as {
    orderId: string;
    refundAmount: number;
    lineItemId?: string;
    reason?: string;
  };
  const order = await Order.findById(orderId);
  if (!order || (order as any).deleted) return res.status(404).json({ error: 'Order not found' });

  // Enforce refund policy window
  const { RefundPolicy } = require('../models/RefundPolicy');
  const activePolicy = await RefundPolicy.findOne({ active: true });
  if (activePolicy) {
    const now = Date.now();
    const createdAt = new Date((order as any).createdAt).getTime();
    const daysSince = (now - createdAt) / (1000 * 60 * 60 * 24);
    if (daysSince > activePolicy.daysWindow) {
      return res
        .status(403)
        .json({ error: `Refunds allowed within ${activePolicy.daysWindow} days.` });
    }
  }

  // Find payment intent tied to order
  const pi = await PaymentIntent.findOne({ orderId: new Types.ObjectId(orderId) });
  if (
    !pi ||
    !(pi.status === PaymentStatus.SUCCEEDED || pi.status === PaymentStatus.PARTIALLY_REFUNDED)
  ) {
    return res.status(400).json({ error: 'No captured payment to refund' });
  }

  // Compute commission reversal
  let commissionReversal = 0;
  if (lineItemId) {
    const line = (order.items as any[]).find((l: any) => l._id?.toString() === lineItemId);
    if (!line) return res.status(404).json({ error: 'Line item not found' });
    const lineGross = line.price * (line.quantity || 1);
    const ratio = Math.min(1, Math.max(0, refundAmount / lineGross));
    const adjust = Math.round((line.commission || 0) * ratio * 100) / 100;
    line.commission = Math.round(((line.commission || 0) - adjust) * 100) / 100;
    commissionReversal += adjust;
    // Ledger entry per line
    await CommissionLedger.create({
      orderId: order._id,
      lineItemId: line._id,
      amount: -adjust,
      currency: order.currency,
      reason: 'refund',
    });
  } else {
    // Full refund proportional to entire order
    for (const line of order.items as any[]) {
      const adjust = line.commission || 0;
      if (adjust) {
        commissionReversal += adjust;
        line.commission = 0;
        await CommissionLedger.create({
          orderId: order._id,
          lineItemId: line._id,
          amount: -adjust,
          currency: order.currency,
          reason: 'refund',
        });
      }
    }
  }

  await order.save();

  // Perform gateway refund via model method (stubbed to immediate success in model)
  await pi.refund(refundAmount, reason);

  // Audit log (immutable chain handled by separate model; here just basic log)
  await AuditLog.create({
    user: (req as any).user?.id,
    action: 'refund_initiated',
    resource: 'order',
    resourceId: orderId,
    details: { refundAmount, lineItemId, commissionReversal },
  });

  return res.json({ success: true, data: { order, commissionReversal, paymentIntent: pi } });
}
