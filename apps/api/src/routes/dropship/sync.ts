import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Zod schemas for validation
const triggerSyncSchema = z.object({
  supplierId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID'),
  syncType: z.enum(['full', 'delta', 'prices_only', 'stock_only']).optional(),
});

/**
 * POST /api/dropship/sync/trigger
 * Manually trigger a supplier sync job.
 */
router.post('/trigger', async (req, res) => {
  try {
    // @ts-expect-error: req.user is injected by auth middleware and not typed in Express.Request
    const { userId, userType } = req.user;

    // Validate request body
    const validatedData = triggerSyncSchema.parse(req.body);

    // RBAC: Only vendors and admins can trigger syncs
    if (userType !== 'vendor' && userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    // TODO: Check if supplier belongs to vendor (RBAC)
    // TODO: Add sync job to BullMQ queue
    // TODO: Return job ID for status tracking

    res.status(202).json({
      message: 'Sync job queued successfully',
      jobId: `sync-${Date.now()}`, // Placeholder
      supplierId: validatedData.supplierId,
      syncType: validatedData.syncType || 'full',
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return res
        .status(400)
        .json({ error: 'Validation failed', details: (error as z.ZodError).errors });
    }
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/dropship/sync/status/:jobId
 * Get status of a sync job.
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    // TODO: Query BullMQ job status
    // TODO: Return progress, errors, stats

    res.json({
      jobId: req.params.jobId,
      status: 'completed', // Placeholder
      progress: 100,
      stats: {
        productsProcessed: 0,
        productsUpdated: 0,
        productsFailed: 0,
        duration: 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/dropship/sync/history
 * Get sync history for a supplier or vendor.
 */
router.get('/history', async (req, res) => {
  try {
    // @ts-expect-error: req.user is injected by auth middleware and not typed in Express.Request
    const { userId, userType } = req.user;
    const { supplierId, page = 1, limit = 20 } = req.query;

    // RBAC: Vendors can only see their own sync history
    if (userType === 'vendor' && !supplierId) {
      return res.status(400).json({ error: 'supplierId is required for vendors' });
    }

    // TODO: Query JobAudit model for sync history
    // TODO: Filter by vendor/supplier
    // TODO: Paginate results

    res.json({
      history: [], // Placeholder
      total: 0,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/dropship/sync/schedule/:supplierId
 * Get sync schedule for a supplier.
 */
router.get('/schedule/:supplierId', async (req, res) => {
  try {
    // @ts-expect-error: req.user is injected by auth middleware and not typed in Express.Request
    const { userId, userType } = req.user;

    // TODO: Get supplier sync schedule from Supplier model
    // TODO: Check RBAC

    res.json({
      supplierId: req.params.supplierId,
      schedule: 'every 6 hours', // Placeholder
      enabled: true,
      lastSync: null,
      nextSync: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * PUT /api/dropship/sync/schedule/:supplierId
 * Update sync schedule for a supplier.
 */
router.put('/schedule/:supplierId', async (req, res) => {
  try {
    // @ts-expect-error: req.user is injected by auth middleware and not typed in Express.Request
    const { userId, userType } = req.user;
    const { schedule, enabled } = req.body;

    // RBAC: Only vendors and admins can update schedules
    if (userType !== 'vendor' && userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    // TODO: Update supplier sync schedule
    // TODO: Update BullMQ repeatable job

    res.json({
      supplierId: req.params.supplierId,
      schedule,
      enabled,
      message: 'Schedule updated successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

export default router;
