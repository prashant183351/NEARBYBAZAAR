import express from 'express';
import { getVendorAnalytics, getAdminAnalytics } from '../services/adAnalytics';

const router = express.Router();

// Endpoint to fetch analytics for a vendor
router.get('/ad-analytics/vendor/:vendorId', async (req, res) => {
  const { vendorId } = req.params;

  try {
    const analytics = await getVendorAnalytics(vendorId);
    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching vendor analytics:', error);
    res.status(500).json({ error: 'Failed to fetch vendor analytics' });
  }
});

// Endpoint to fetch overall analytics for admin
router.get('/ad-analytics/admin', async (_req, res) => {
  try {
    const analytics = await getAdminAnalytics();
    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
});

export default router;
