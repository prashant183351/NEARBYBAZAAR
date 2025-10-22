/**
 * Ad Dashboard Routes
 * Endpoints for vendor and admin ad dashboards
 */

import { Router } from 'express';
import {
  getVendorDashboardSummary,
  getAdminDashboardOverview,
  getCampaignComparison,
} from '../controllers/adDashboard';

const router = Router();

// Vendor endpoints
router.get('/vendor/summary', getVendorDashboardSummary);
router.get('/vendor/comparison', getCampaignComparison);

// Admin endpoints
router.get('/admin/overview', getAdminDashboardOverview);

export default router;
