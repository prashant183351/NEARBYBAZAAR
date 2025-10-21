// COD order flow and settlement
import { Order } from '../../models/Order';
import { logger } from '../../utils/logger';

// On order creation, if paymentMethod === 'COD', mark as pending payment
export async function markOrderAsCOD(orderId: string) {
  await Order.findByIdAndUpdate(orderId, { paymentMethod: 'COD', status: 'pending_payment' });
}

// Vendor marks COD order as paid (after collection)
export async function settleCODOrder(orderId: string) {
  await Order.findByIdAndUpdate(orderId, { status: 'paid' });
  // TODO: Trigger commission calculation/settlement here
  logger.info(`[COD] Order ${orderId} marked as paid and commission settled.`);
}
