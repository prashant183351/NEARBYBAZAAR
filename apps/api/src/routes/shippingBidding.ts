import { Router } from 'express';
import { getCourierQuotes, selectBestCourier } from '../services/shipping/bidding';
import { logger } from '../utils/logger';

const router = Router();

// POST /v1/shipping/bid - get courier quotes and best option
router.post('/shipping/bid', async (req, res) => {
  try {
    const { origin, destination, weight, dimensions, value, orderId, criteria } = req.body;
    if (!origin?.pincode || !origin?.country || !destination?.pincode || !destination?.country || !weight) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const quotes = await getCourierQuotes({ origin, destination, weight, dimensions, value, orderId });
    const best = selectBestCourier(quotes, criteria);
    res.json({ success: true, data: { quotes, best } });
  } catch (err) {
    logger.error('Shipping bidding error', err);
    res.status(500).json({ success: false, error: 'Failed to fetch courier quotes' });
  }
});

export default router;
