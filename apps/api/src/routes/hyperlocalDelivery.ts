import { Router } from 'express';
import {
  isHyperlocalEligible,
  getHyperlocalProviders,
  scheduleHyperlocalDelivery,
} from '../services/shipping/hyperlocal';
import { logger } from '../utils/logger';

const router = Router();

// POST /v1/shipping/hyperlocal/eligible - check if hyperlocal delivery is possible
router.post('/shipping/hyperlocal/eligible', (req, res) => {
  const { originPincode, destPincode } = req.body;
  if (!originPincode || !destPincode) {
    return res.status(400).json({ success: false, error: 'Missing pincodes' });
  }
  const eligible = isHyperlocalEligible(originPincode, destPincode);
  const providers = eligible ? getHyperlocalProviders(originPincode) : [];
  res.json({ success: true, eligible, providers });
});

// POST /v1/shipping/hyperlocal/schedule - schedule a hyperlocal delivery (stub)
router.post('/shipping/hyperlocal/schedule', async (req, res) => {
  try {
    const { origin, destination, parcel, provider, orderId } = req.body;
    if (!origin?.pincode || !destination?.pincode || !provider || !orderId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const result = await scheduleHyperlocalDelivery({
      origin,
      destination,
      parcel,
      provider,
      orderId,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Hyperlocal schedule error', err);
    res.status(500).json({ success: false, error: 'Failed to schedule hyperlocal delivery' });
  }
});

export default router;
