/**
 * Buy Box Controller - Feature #183
 *
 * Exposes buy box calculation and admin override functionality via REST API
 */

import { Request, Response } from 'express';
import { Types } from 'mongoose';
import {
  calculateBuyBox,
  getBuyBoxWinner,
  setAdminOverride,
  clearAdminOverride,
  invalidateBuyBoxCache,
  batchCalculateBuyBox,
  BuyBoxOverride,
} from '../services/buyBox';

// ==================== PUBLIC ENDPOINTS ====================

/**
 * GET /buybox/product/:productId
 *
 * Calculate and return buy box result for a product
 *
 * Public endpoint - anyone can see which offer wins the buy box
 *
 * Query params:
 * - forceRecalculate: boolean (skip cache, default false)
 * - winnerId: boolean (return only winner ID, default false)
 *
 * Response:
 * - 200: Buy box result with winner and all scores
 * - 404: No offers found for product
 * - 400: Invalid product ID
 */
export const getBuyBoxForProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const forceRecalculate = req.query.forceRecalculate === 'true';
    const winnerOnly = req.query.winnerId === 'true';

    // Validate product ID
    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid product ID format',
      });
      return;
    }

    const productObjectId = new Types.ObjectId(productId);

    // Lightweight response for simple use cases
    if (winnerOnly) {
      const winnerId = await getBuyBoxWinner(productObjectId);

      if (!winnerId) {
        res.status(404).json({
          success: false,
          error: 'No offers available for this product',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          winnerId: winnerId.toString(),
        },
      });
      return;
    }

    // Full buy box calculation
    const result = await calculateBuyBox(productObjectId, forceRecalculate);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'No offers available for this product',
      });
      return;
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error calculating buy box:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate buy box',
    });
  }
};

/**
 * POST /buybox/batch
 *
 * Batch calculate buy boxes for multiple products
 *
 * Useful for category pages or search results where multiple products
 * need buy box winners determined simultaneously
 *
 * Body:
 * {
 *   "productIds": ["64abc...", "64def..."]
 * }
 *
 * Response:
 * - 200: Map of product IDs to buy box results
 * - 400: Invalid input
 */
export const batchGetBuyBox = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productIds } = req.body;

    // Validate input
    if (!Array.isArray(productIds) || productIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'productIds must be a non-empty array',
      });
      return;
    }

    // Limit batch size to prevent abuse
    if (productIds.length > 50) {
      res.status(400).json({
        success: false,
        error: 'Maximum 50 products per batch request',
      });
      return;
    }

    // Validate all IDs
    const validIds: Types.ObjectId[] = [];
    for (const id of productIds) {
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: `Invalid product ID format: ${id}`,
        });
        return;
      }
      validIds.push(new Types.ObjectId(id));
    }

    // Batch calculate
    const results = await batchCalculateBuyBox(validIds);

    // Convert Map to object for JSON response
    const resultsObject: Record<string, any> = {};
    results.forEach((value, key) => {
      resultsObject[key] = value;
    });

    res.json({
      success: true,
      data: resultsObject,
    });
  } catch (error) {
    console.error('Error in batch buy box calculation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate buy boxes',
    });
  }
};

/**
 * POST /buybox/admin/override
 *
 * Admin endpoint to manually set buy box winner for a product
 *
 * Use cases:
 * - Promote specific vendor for business reasons
 * - Run promotions or campaigns
 * - Override algorithm for fairness/quality reasons
 *
 * Body:
 * {
 *   "productId": "64abc...",
 *   "offerId": "64def...",
 *   "reason": "Promotional campaign",
 *   "expiresAt": "2024-12-31T23:59:59Z" // Optional
 * }
 *
 * Response:
 * - 200: Override set successfully
 * - 400: Invalid input or missing required fields
 * - 403: User is not admin
 */
export const setAdminBuyBoxOverride = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify admin role (should be enforced by middleware, but double-check)
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const { productId, offerId, reason, expiresAt } = req.body;

    // Validate required fields
    if (!productId || !offerId || !reason) {
      res.status(400).json({
        success: false,
        error: 'productId, offerId, and reason are required',
      });
      return;
    }

    // Validate ObjectIds
    if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(offerId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid productId or offerId format',
      });
      return;
    }

    // Validate expiration date if provided
    let expirationDate: Date | undefined;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
      if (isNaN(expirationDate.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid expiresAt date format',
        });
        return;
      }

      // Expiration must be in the future
      if (expirationDate <= new Date()) {
        res.status(400).json({
          success: false,
          error: 'expiresAt must be a future date',
        });
        return;
      }
    }

    // TODO: Verify that offerId actually belongs to productId
    // const offer = await ProductOffer.findOne({ _id: offerId, productId });
    // if (!offer) {
    //   res.status(400).json({
    //     success: false,
    //     error: 'Offer does not belong to this product',
    //   });
    //   return;
    // }

    // Create override
    const override: BuyBoxOverride = {
      productId: new Types.ObjectId(productId),
      offerId: new Types.ObjectId(offerId),
      vendorId: new Types.ObjectId('000000000000000000000000'), // TODO: Get from offer
      reason,
      setBy: new Types.ObjectId(req.user.id),
      setAt: new Date(),
      expiresAt: expirationDate,
    };

    await setAdminOverride(override);

    res.json({
      success: true,
      message: 'Buy box override set successfully',
      data: {
        productId,
        offerId,
        expiresAt: expirationDate?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error setting buy box override:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set buy box override',
    });
  }
};

/**
 * DELETE /buybox/admin/override/:productId
 *
 * Admin endpoint to remove manual override for a product
 *
 * Response:
 * - 200: Override cleared successfully
 * - 400: Invalid product ID
 * - 403: User is not admin
 */
export const clearAdminBuyBoxOverride = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify admin role
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const { productId } = req.params;

    // Validate product ID
    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid product ID format',
      });
      return;
    }

    await clearAdminOverride(new Types.ObjectId(productId));

    res.json({
      success: true,
      message: 'Buy box override cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing buy box override:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear buy box override',
    });
  }
};

/**
 * POST /buybox/admin/invalidate/:productId
 *
 * Admin endpoint to force cache invalidation for a product
 *
 * Useful when:
 * - Vendor metrics updated externally
 * - Manual intervention needed to trigger recalculation
 *
 * Response:
 * - 200: Cache invalidated successfully
 * - 400: Invalid product ID
 * - 403: User is not admin
 */
export const invalidateBuyBoxCacheEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify admin role
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const { productId } = req.params;

    // Validate product ID
    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid product ID format',
      });
      return;
    }

    await invalidateBuyBoxCache(new Types.ObjectId(productId));

    res.json({
      success: true,
      message: 'Buy box cache invalidated successfully',
    });
  } catch (error) {
    console.error('Error invalidating buy box cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate buy box cache',
    });
  }
};

/**
 * GET /buybox/admin/scoring-weights
 *
 * Admin endpoint to view current scoring algorithm weights
 *
 * Useful for:
 * - Understanding how buy box is calculated
 * - Debugging algorithm behavior
 * - Documentation purposes
 *
 * Response:
 * - 200: Scoring weights configuration
 */
export const getScoringWeights = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Import dynamically to avoid circular dependency
    const { SCORING_WEIGHTS } = await import('../services/buyBox');

    res.json({
      success: true,
      data: {
        weights: SCORING_WEIGHTS,
        description: {
          price: 'Lower price scores higher (40% weight)',
          vendorRating: 'Higher rating scores higher (25% weight)',
          deliverySLA: 'Faster delivery scores higher (20% weight)',
          cancellationRate: 'Lower cancellation rate scores higher (10% weight)',
          stockLevel: 'More stock scores higher (5% weight)',
        },
        notes: [
          'All component scores normalized to 0-100 scale',
          'Weighted sum produces final score (0-100)',
          'Tie-breaker: Vendor with more reviews wins',
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching scoring weights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scoring weights',
    });
  }
};
