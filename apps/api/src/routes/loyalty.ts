import { Router } from 'express';
import {
  awardPoints,
  getLoyaltyStatus,
  redeemPoints,
  vendorAwardPoints,
} from '../services/loyalty';
import { Types } from 'mongoose';
// import { requireAuth, requireRole } from '../middleware/guard'; // Uncomment when RBAC is ready

const router = Router();

// Get current user's loyalty status
router.get(
  '/me',
  /*requireAuth,*/ async (req: any, res) => {
    const userId = req.user?._id || req.query.userId; // fallback for testing
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const loyalty = await getLoyaltyStatus(new Types.ObjectId(userId));
    res.json({ success: true, data: loyalty });
  },
);

// Award points (admin or system action)
router.post(
  '/award',
  /*requireAuth, requireRole('admin'),*/ async (req: any, res) => {
    const { userId, action, points, refId, meta } = req.body;
    if (!userId || !action || typeof points !== 'number')
      return res.status(400).json({ error: 'Missing fields' });
    const loyalty = await awardPoints({
      userId: new Types.ObjectId(userId),
      action,
      points,
      refId,
      meta,
    });
    res.json({ success: true, data: loyalty });
  },
);

// Redeem points
router.post(
  '/redeem',
  /*requireAuth,*/ async (req: any, res) => {
    const { userId, points } = req.body;
    if (!userId || typeof points !== 'number')
      return res.status(400).json({ error: 'Missing fields' });
    try {
      const loyalty = await redeemPoints({ userId: new Types.ObjectId(userId), points });
      res.json({ success: true, data: loyalty });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
);

// Vendor awards points to user (custom action)
router.post(
  '/vendor/award',
  /*requireAuth, requireRole('vendor'),*/ async (req: any, res) => {
    const { vendorId, userId, points, meta } = req.body;
    if (!vendorId || !userId || typeof points !== 'number')
      return res.status(400).json({ error: 'Missing fields' });
    const loyalty = await vendorAwardPoints({
      vendorId: new Types.ObjectId(vendorId),
      userId: new Types.ObjectId(userId),
      points,
      meta,
    });
    res.json({ success: true, data: loyalty });
  },
);

export default router;
