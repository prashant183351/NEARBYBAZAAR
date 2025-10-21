/**
 * Buy Box Routes - Feature #183
 * 
 * Routes for buy box calculation and admin management
 */

import { Router } from 'express';
import {
  getBuyBoxForProduct,
  batchGetBuyBox,
  setAdminBuyBoxOverride,
  clearAdminBuyBoxOverride,
  invalidateBuyBoxCacheEndpoint,
  getScoringWeights,
} from '../controllers/buyBox';
// import { requireAuth, rbacGuard } from '../middleware/auth'; // Uncomment when auth middleware exists

const router = Router();

// ==================== PUBLIC ROUTES ====================

/**
 * GET /product/:productId
 * 
 * Get buy box winner for a specific product
 * Query params:
 * - forceRecalculate: boolean (skip cache)
 * - winnerId: boolean (return only winner ID for lightweight response)
 */
router.get('/product/:productId', getBuyBoxForProduct);

/**
 * POST /batch
 * 
 * Batch calculate buy boxes for multiple products
 * Body: { productIds: string[] }
 */
router.post('/batch', batchGetBuyBox);

// ==================== ADMIN ROUTES ====================
// These routes require admin authentication (uncomment middleware when available)

/**
 * POST /admin/override
 * 
 * Set manual buy box winner for a product
 * Body: {
 *   productId: string,
 *   offerId: string,
 *   reason: string,
 *   expiresAt?: string (ISO date)
 * }
 */
router.post(
  '/admin/override',
  // requireAuth,
  // rbacGuard('admin'),
  setAdminBuyBoxOverride
);

/**
 * DELETE /admin/override/:productId
 * 
 * Clear manual override for a product
 */
router.delete(
  '/admin/override/:productId',
  // requireAuth,
  // rbacGuard('admin'),
  clearAdminBuyBoxOverride
);

/**
 * POST /admin/invalidate/:productId
 * 
 * Force cache invalidation for a product's buy box
 */
router.post(
  '/admin/invalidate/:productId',
  // requireAuth,
  // rbacGuard('admin'),
  invalidateBuyBoxCacheEndpoint
);

/**
 * GET /admin/scoring-weights
 * 
 * View current scoring algorithm weights and configuration
 */
router.get('/admin/scoring-weights', getScoringWeights);

export default router;
