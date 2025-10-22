import { Router, Request, Response } from 'express';
import {
  getVendorB2BSummary,
  getAdminB2BBreakdown,
  getVendorB2BExport,
  getAdminB2BExport,
  exportDataToCSV,
  getVendorB2BTrends,
} from '../services/analytics/b2bAnalytics';

const router = Router();

// Accept web-vitals metrics from frontend
router.post('/analytics/web-vitals', (req, res) => {
  // Scrub PII if present
  const { name, value, id, label } = req.body;
  // TODO: Store or forward to metrics backend
  // For now, just log (in production, send to a time-series DB or monitoring)
  req.app.get('logger')?.info?.('[WebVitals]', { name, value, id, label });
  res.json({ success: true });
});

// ============================================================================
// B2B ANALYTICS ROUTES
// ============================================================================

/**
 * GET /v1/analytics/vendor/b2b/summary
 * Get vendor's B2B sales summary
 */
router.get('/vendor/b2b/summary', async (req: Request, res: Response) => {
  try {
    const vendorId = (req.query.vendorId as string) || 'VENDOR_ID'; // Replace with req.user.vendorId

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'vendorId is required',
      });
    }

    const summary = await getVendorB2BSummary(vendorId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error getting vendor B2B summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get B2B summary',
    });
  }
});

/**
 * GET /v1/analytics/vendor/b2b/trends
 * Get vendor's B2B trends for charting
 */
router.get('/vendor/b2b/trends', async (req: Request, res: Response) => {
  try {
    const vendorId = (req.query.vendorId as string) || 'VENDOR_ID';
    const days = parseInt(req.query.days as string) || 30;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'vendorId is required',
      });
    }

    const trends = await getVendorB2BTrends(vendorId, days);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error: any) {
    console.error('Error getting vendor B2B trends:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get B2B trends',
    });
  }
});

/**
 * GET /v1/analytics/vendor/b2b/export
 * Export vendor's B2B orders as CSV
 */
router.get('/vendor/b2b/export', async (req: Request, res: Response) => {
  try {
    const vendorId = (req.query.vendorId as string) || 'VENDOR_ID';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const format = (req.query.format as string) || 'csv';

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'vendorId is required',
      });
    }

    const exportData = await getVendorB2BExport(vendorId, startDate, endDate);

    if (format === 'csv') {
      const csv = exportDataToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=b2b_orders_${vendorId}_${Date.now()}.csv`,
      );
      res.send(csv);
    } else {
      // JSON format
      res.json({
        success: true,
        data: exportData,
        count: exportData.length,
      });
    }
  } catch (error: any) {
    console.error('Error exporting vendor B2B data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export B2B data',
    });
  }
});

/**
 * GET /v1/analytics/admin/b2b/breakdown
 * Get platform-wide B2B analytics (admin only)
 */
router.get('/admin/b2b/breakdown', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin auth check
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const breakdown = await getAdminB2BBreakdown(startDate, endDate);

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error: any) {
    console.error('Error getting admin B2B breakdown:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get B2B breakdown',
    });
  }
});

/**
 * GET /v1/analytics/admin/b2b/export
 * Export platform-wide B2B orders as CSV (admin only)
 */
router.get('/admin/b2b/export', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin auth check
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const region = req.query.region as string;
    const industry = req.query.industry as string;
    const format = (req.query.format as string) || 'csv';

    const exportData = await getAdminB2BExport(startDate, endDate, region, industry);

    if (format === 'csv') {
      const csv = exportDataToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=b2b_orders_platform_${Date.now()}.csv`,
      );
      res.send(csv);
    } else {
      // JSON format
      res.json({
        success: true,
        data: exportData,
        count: exportData.length,
      });
    }
  } catch (error: any) {
    console.error('Error exporting admin B2B data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export B2B data',
    });
  }
});

/**
 * GET /v1/analytics/admin/b2b/regions
 * Get list of all regions with B2B activity (for filters)
 */
router.get('/admin/b2b/regions', async (_req: Request, res: Response) => {
  try {
    const { Order } = await import('../models/Order');

    const regions = await Order.distinct('region', {
      isBulkOrder: true,
      deleted: false,
      region: { $exists: true, $ne: null },
    });

    res.json({
      success: true,
      data: regions.sort(),
    });
  } catch (error: any) {
    console.error('Error getting regions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get regions',
    });
  }
});

/**
 * GET /v1/analytics/admin/b2b/industries
 * Get list of all industries with B2B activity (for filters)
 */
router.get('/admin/b2b/industries', async (_req: Request, res: Response) => {
  try {
    const { Order } = await import('../models/Order');

    const industries = await Order.distinct('industry', {
      isBulkOrder: true,
      deleted: false,
      industry: { $exists: true, $ne: null },
    });

    res.json({
      success: true,
      data: industries.sort(),
    });
  } catch (error: any) {
    console.error('Error getting industries:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get industries',
    });
  }
});

export default router;
