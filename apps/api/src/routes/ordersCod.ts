import { Router } from 'express';
import { markOrderAsCOD, settleCODOrder } from '../services/orders/cod';
import { logger } from '../utils/logger';

const router = Router();

// PATCH /v1/orders/:orderId/cod (mark as COD)
router.patch('/orders/:orderId/cod', async (req, res) => {
  try {
    const { orderId } = req.params;
    await markOrderAsCOD(orderId);
    res.json({ success: true });
  } catch (err) {
    logger.error('Mark COD error', err);
    res.status(500).json({ success: false, error: 'Failed to mark order as COD' });
  }
});

// PATCH /v1/orders/:orderId/cod/settle (vendor marks as paid)
router.patch('/orders/:orderId/cod/settle', async (req, res) => {
  try {
    const { orderId } = req.params;
    await settleCODOrder(orderId);
    res.json({ success: true });
  } catch (err) {
    logger.error('Settle COD error', err);
    res.status(500).json({ success: false, error: 'Failed to settle COD order' });
  }
});

export default router;
