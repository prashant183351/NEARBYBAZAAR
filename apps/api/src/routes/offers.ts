/**
 * ProductOffer Routes
 * Feature #182 - Multi-seller marketplace
 * 
 * Routes for managing product offers:
 * - Public: View active offers for products
 * - Vendor: Manage own offers (CRUD)
 * - Admin: Oversight and moderation
 */

import { Router } from 'express';
import {
  createOffer,
  updateOffer,
  deleteOffer,
  getProductOffers,
  getMyOffers,
  getOfferById,
  updateStock,
  getLowStockAlerts,
  togglePause,
} from '../controllers/offers';

const router = Router();

// ==================== PUBLIC ROUTES ====================

/**
 * Get all active offers for a specific product
 * Used for "More Buying Options" on product pages
 * GET /api/offers/product/:productId
 */
router.get('/product/:productId', getProductOffers);

/**
 * Get a single offer by ID
 * GET /api/offers/:id
 */
router.get('/:id', getOfferById);

// ==================== VENDOR ROUTES ====================
// TODO: Add auth middleware - rbacGuard('vendor') or similar

/**
 * Create a new offer
 * POST /api/offers
 * Auth: Vendor only
 */
router.post('/', createOffer);

/**
 * Get vendor's own offers
 * GET /api/offers/my-offers
 * Auth: Vendor only
 */
router.get('/my-offers', getMyOffers);

/**
 * Get low stock alerts for vendor
 * GET /api/offers/low-stock
 * Auth: Vendor only
 */
router.get('/low-stock', getLowStockAlerts);

/**
 * Update an offer
 * PUT /api/offers/:id
 * Auth: Vendor (owner only)
 */
router.put('/:id', updateOffer);

/**
 * Update stock atomically
 * PATCH /api/offers/:id/stock
 * Auth: Vendor (owner only)
 * Body: { quantity: number } (positive to add, negative to subtract)
 */
router.patch('/:id/stock', updateStock);

/**
 * Toggle pause status
 * PATCH /api/offers/:id/pause
 * Auth: Vendor (owner only)
 */
router.patch('/:id/pause', togglePause);

/**
 * Delete (soft delete) an offer
 * DELETE /api/offers/:id
 * Auth: Vendor (owner only)
 */
router.delete('/:id', deleteOffer);

// ==================== ADMIN ROUTES ====================
// TODO: Add admin-specific routes for oversight
// - GET /api/offers/admin/all - List all offers with filters
// - PATCH /api/offers/admin/:id/suspend - Suspend problematic offers
// - GET /api/offers/admin/reports - Performance reports

export default router;
