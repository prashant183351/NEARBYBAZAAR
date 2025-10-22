import { Router, Request, Response } from 'express';
import { Order } from '../../../models/Order';

const router = Router();

// Map supplier status codes to our order status
const statusMap: Record<string, 'pending' | 'cancelled' | 'confirmed' | 'completed'> = {
  shipped: 'confirmed',
  delivered: 'completed',
  partial: 'pending',
  cancelled: 'cancelled',
  // ...add more as needed
};

router.post('/', async (req: Request, res: Response) => {
  const { orderId, supplierStatus, trackingNumber, items } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Handle partial shipments/split orders
  if (supplierStatus === 'partial' && items) {
    // Update only shipped items, leave others pending
    // ...custom logic here...
  }

  // Update order status
  order.status = statusMap[supplierStatus] ?? order.status;
  if (trackingNumber && 'trackingNumber' in order) {
    (order as any).trackingNumber = trackingNumber;
  }
  await order.save();

  // TODO: Notify buyer and vendor of status update

  res.json({ status: 'ok' });
});

export default router;
