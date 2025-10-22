import { Request, Response, NextFunction } from 'express';
import { Subscription } from '../models/Subscription';
import { Classified } from '../models/Classified';

// Middleware: enforce plan quotas and feature access
export async function enforcePlanQuota(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const vendorId = req.user?.id || req.body.vendorId;
    if (!vendorId) return res.status(401).json({ error: 'Vendor not authenticated' });
    // Get active subscription
    const sub = await Subscription.findOne({ vendor: vendorId, status: 'active' }).populate('plan');
    if (!sub || !sub.plan)
      return res.status(403).json({ error: 'No active plan. Please subscribe.' });
    const plan = sub.plan as any;
    // Quota enforcement
    if (feature === 'listing') {
      const count = await Classified.countDocuments({ vendor: vendorId, deleted: false });
      if (count >= plan.maxListings) {
        return res.status(403).json({
          error: `Your plan allows up to ${plan.maxListings} listings. Please upgrade for more.`,
        });
      }
    }
    // Feature enforcement
    if (feature === 'featured' && (!plan.features || !plan.features.includes('featured'))) {
      return res
        .status(403)
        .json({ error: 'Featured listings are not enabled on your current plan. Please upgrade.' });
    }
    next();
  };
}
