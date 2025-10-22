import { Router } from 'express';
import {
  getVendorReputation,
  getAllVendorsReputation,
  evaluateVendor,
} from '../controllers/metrics/reputation';

const router = Router();

/**
 * @openapi
 * /reputation/vendor:
 *   get:
 *     summary: Get reputation metrics for authenticated vendor
 *     tags:
 *       - Reputation
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to calculate metrics for
 *     responses:
 *       200:
 *         description: Vendor reputation metrics
 */
router.get('/vendor', getVendorReputation);

/**
 * @openapi
 * /reputation/admin:
 *   get:
 *     summary: Get reputation metrics for all vendors (admin only)
 *     tags:
 *       - Reputation
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to calculate metrics for
 *     responses:
 *       200:
 *         description: All vendors reputation metrics with summary
 */
router.get('/admin', getAllVendorsReputation);

/**
 * @openapi
 * /reputation/evaluate/{vendorId}:
 *   get:
 *     summary: Evaluate vendor standing and get recommended action (admin only)
 *     tags:
 *       - Reputation
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID to evaluate
 *     responses:
 *       200:
 *         description: Vendor evaluation result
 */
router.get('/evaluate/:vendorId', evaluateVendor);

export default router;
