import { Router } from 'express';
import { Vendor } from '../models/Vendor';
import { logger } from '../utils/logger';

const router = Router();

// PATCH /v1/vendor/cod (toggle COD for vendor)
router.patch('/vendor/cod', async (req, res) => {
  try {
    const vendorId = req.user?.id;
    if (!vendorId) return res.status(401).json({ success: false, error: 'Not a vendor' });
    const { codEnabled } = req.body;
    await Vendor.findByIdAndUpdate(vendorId, { codEnabled });
    res.json({ success: true });
  } catch (err) {
    logger.error('COD toggle error', err);
    res.status(500).json({ success: false, error: 'Failed to update COD setting' });
  }
});

export default router;
