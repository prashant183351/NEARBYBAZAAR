import express from 'express';
import { Vendor } from '../models/Vendor';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authorize } from '../middleware/auth';

const router = express.Router();

// Schema for UPI details
const UpiDetailsSchema = z.object({
  upiVpa: z.string().optional(),
  upiQrCode: z.string().url().optional(),
  upiEnabled: z.boolean().optional(),
});

// Update UPI details
router.put(
  '/vendor/upi',
  authorize({ action: 'update', resource: 'vendor' }),
  validate(UpiDetailsSchema),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const vendorId = req.user.id; // Use id for vendor identification
      const updates = req.body;

      const vendor = await Vendor.findByIdAndUpdate(vendorId, updates, { new: true });
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      res.json({ success: true, vendor });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update UPI details' });
    }
  },
);

// Fetch UPI details
router.get('/vendor/upi', authorize({ action: 'read', resource: 'vendor' }), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const vendorId = req.user.id; // Use id for vendor identification
    const vendor = await Vendor.findById(vendorId).select('upiVpa upiQrCode upiEnabled');

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch UPI details' });
  }
});

export default router;
