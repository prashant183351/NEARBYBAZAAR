import { Router } from 'express';
import Return from '../models/Return';
import { logger } from '../utils/logger';

const router = Router();

// GET /v1/vendor/returns (list returns for vendor)
router.get('/vendor/returns', async (req, res) => {
  try {
    const vendorId = req.user?.id;
    if (!vendorId) return res.status(401).json({ success: false, error: 'Not a vendor' });
    const returns = await Return.find({ vendorId }).lean();
    res.json({ success: true, data: returns });
  } catch (err) {
    logger.error('Vendor returns error', err);
    res.status(500).json({ success: false, error: 'Failed to fetch returns' });
  }
});

// PATCH /v1/vendor/returns/:returnId/approve (approve/arrange return)
router.patch('/vendor/returns/:returnId/approve', async (req, res) => {
  try {
    const { returnId } = req.params;
    await Return.findByIdAndUpdate(returnId, { status: 'vendor_approved' });
    res.json({ success: true });
  } catch (err) {
    logger.error('Approve return error', err);
    res.status(500).json({ success: false, error: 'Failed to approve return' });
  }
});

export default router;
