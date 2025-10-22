import { Router } from 'express';
import * as orders from '../controllers/orders';
import { authorize } from '../middleware/auth';

const router = Router();

router.get(
  '/',
  authorize({
    action: 'read',
    resource: 'order',
    requireAuth: true,
    getContext: (req) => ({ resourceOwnerId: (req as any).user?.id ?? null }),
  }),
  orders.listOrders,
);

router.post('/', orders.createOrder);
// More endpoints to be added in later chunks

export default router;
