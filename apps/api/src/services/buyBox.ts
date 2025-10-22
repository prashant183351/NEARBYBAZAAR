/**
 * Buy Box Service - Feature #183
 *
 * Determines which vendor's offer wins the "Buy Box" (default add-to-cart vendor)
 * when multiple vendors sell the same product.
 *
 * Scoring Algorithm:
 * - Price: 40% weight (lower is better)
 * - Vendor Rating: 25% weight (higher is better)
 * - Delivery SLA: 20% weight (faster is better)
 * - Cancellation Rate: 10% weight (lower is better)
 * - Stock Level: 5% weight (higher availability is better)
 *
 * Features:
 * - Redis caching (configurable TTL, default 5 minutes)
 * - Admin manual override capability
 * - Tie-breaking logic (vendor with more reviews wins)
 * - Handles edge cases (missing vendor data, zero offers)
 */

import { Types } from 'mongoose';
import { ProductOffer } from '../models/ProductOffer';
import Redis from 'ioredis';

// Initialize Redis client (assuming already configured in app)
let redisClient: Redis | null = null;

/**
 * Initialize Redis client for buy box caching
 */
export const initBuyBoxCache = (client: Redis) => {
  redisClient = client;
};

/**
 * Scoring weights - should sum to 100%
 */
export const SCORING_WEIGHTS = {
  price: 0.4, // 40% - Price is most important
  vendorRating: 0.25, // 25% - Trust and quality matter
  deliverySLA: 0.2, // 20% - Speed is important for buyers
  cancellationRate: 0.1, // 10% - Reliability matters
  stockLevel: 0.05, // 5% - Availability bonus
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  ttl: 300, // 5 minutes in seconds
  keyPrefix: 'buybox:',
} as const;

/**
 * Interface for vendor performance metrics
 * (Would come from Vendor model or separate analytics)
 */
export interface VendorMetrics {
  rating: number; // 0-5 scale
  totalReviews: number; // Number of reviews (for tie-breaking)
  cancellationRate: number; // 0-1 (0 = no cancellations, 1 = all cancelled)
  orderDefectRate?: number; // Optional: returns, refunds, disputes
}

/**
 * Interface for buy box calculation result
 */
export interface BuyBoxResult {
  winnerId: Types.ObjectId;
  winnerScore: number;
  allScores: Array<{
    offerId: Types.ObjectId;
    vendorId: Types.ObjectId;
    score: number;
    breakdown: ScoreBreakdown;
  }>;
  calculatedAt: Date;
  source: 'calculated' | 'admin_override' | 'cached';
  cacheExpiresAt?: Date;
}

/**
 * Interface for score breakdown (transparency)
 */
export interface ScoreBreakdown {
  priceScore: number;
  vendorRatingScore: number;
  deliverySLAScore: number;
  cancellationScore: number;
  stockScore: number;
  totalScore: number;
  normalizedPrice?: number; // For comparison
}

/**
 * Interface for admin override record
 */
export interface BuyBoxOverride {
  productId: Types.ObjectId;
  offerId: Types.ObjectId;
  vendorId: Types.ObjectId;
  reason: string;
  setBy: Types.ObjectId; // Admin user ID
  setAt: Date;
  expiresAt?: Date; // Optional expiration
}

/**
 * In-memory store for admin overrides
 * (In production, this should be a MongoDB collection)
 */
const overrides = new Map<string, BuyBoxOverride>();

/**
 * Calculate normalized price score (0-100, higher is better)
 *
 * Uses inverse normalization: cheapest offer gets 100, most expensive gets 0
 *
 * @param offerPrice - Price of current offer
 * @param minPrice - Cheapest price among all offers
 * @param maxPrice - Most expensive price among all offers
 */
export const calculatePriceScore = (
  offerPrice: number,
  minPrice: number,
  maxPrice: number,
): number => {
  // Edge case: all offers same price
  if (minPrice === maxPrice) {
    return 100;
  }

  // Inverse normalization: lower price = higher score
  // Formula: 100 * (1 - (price - min) / (max - min))
  const normalizedPosition = (offerPrice - minPrice) / (maxPrice - minPrice);
  const score = 100 * (1 - normalizedPosition);

  return Math.max(0, Math.min(100, score)); // Clamp to 0-100
};

/**
 * Calculate vendor rating score (0-100)
 *
 * @param rating - Vendor rating (0-5 scale)
 */
export const calculateVendorRatingScore = (rating: number): number => {
  // Convert 0-5 scale to 0-100
  const score = (rating / 5) * 100;
  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate delivery SLA score (0-100, faster is better)
 *
 * Assumes typical range: 1-30 days
 * 1 day = 100, 30 days = 0
 *
 * @param slaInDays - Total delivery time (SLA + handling)
 */
export const calculateDeliverySLAScore = (slaInDays: number): number => {
  // Typical range: 1-30 days
  const minSLA = 1;
  const maxSLA = 30;

  // Clamp to realistic range
  const clampedSLA = Math.max(minSLA, Math.min(maxSLA, slaInDays));

  // Inverse: faster delivery = higher score
  const normalizedPosition = (clampedSLA - minSLA) / (maxSLA - minSLA);
  const score = 100 * (1 - normalizedPosition);

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate cancellation rate score (0-100, lower rate is better)
 *
 * @param cancellationRate - 0-1 (0 = perfect, 1 = terrible)
 */
export const calculateCancellationScore = (cancellationRate: number): number => {
  // Inverse: lower cancellation = higher score
  // 0% cancellations = 100, 100% cancellations = 0
  const score = 100 * (1 - cancellationRate);
  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate stock level score (0-100, more stock is better)
 *
 * Provides small bonus for high stock levels (reduces out-of-stock risk)
 * Assumes typical range: 0-1000 units
 *
 * @param stockQuantity - Available stock
 */
export const calculateStockScore = (stockQuantity: number): number => {
  // Logarithmic scale to prevent huge stock from dominating
  // 0 stock = 0, 10 stock = ~50, 100+ stock = ~100
  if (stockQuantity === 0) {
    return 0;
  }

  // Log scale with cap at 1000 units
  const cappedStock = Math.min(stockQuantity, 1000);
  const score = (Math.log10(cappedStock + 1) / Math.log10(1001)) * 100;

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate comprehensive score for a single offer
 *
 * @param offer - Product offer to score
 * @param vendorMetrics - Vendor performance data
 * @param minPrice - Cheapest price among all offers (for normalization)
 * @param maxPrice - Most expensive price among all offers (for normalization)
 */
export const calculateOfferScore = (
  offer: any, // IProductOffer (using any to avoid circular dependency)
  vendorMetrics: VendorMetrics,
  minPrice: number,
  maxPrice: number,
): ScoreBreakdown => {
  // Calculate individual component scores (0-100 each)
  const priceScore = calculatePriceScore(offer.price, minPrice, maxPrice);
  const vendorRatingScore = calculateVendorRatingScore(vendorMetrics.rating);

  // Total delivery time = SLA + handling time
  const totalDeliveryTime = (offer.slaInDays || 7) + (offer.handlingTimeInDays || 2);
  const deliverySLAScore = calculateDeliverySLAScore(totalDeliveryTime);

  const cancellationScore = calculateCancellationScore(vendorMetrics.cancellationRate);
  const stockScore = calculateStockScore(offer.stockQuantity);

  // Apply weights and sum to get total score (0-100)
  const totalScore =
    priceScore * SCORING_WEIGHTS.price +
    vendorRatingScore * SCORING_WEIGHTS.vendorRating +
    deliverySLAScore * SCORING_WEIGHTS.deliverySLA +
    cancellationScore * SCORING_WEIGHTS.cancellationRate +
    stockScore * SCORING_WEIGHTS.stockLevel;

  return {
    priceScore,
    vendorRatingScore,
    deliverySLAScore,
    cancellationScore,
    stockScore,
    totalScore,
    normalizedPrice: offer.price,
  };
};

/**
 * Fetch vendor metrics from database or cache
 *
 * In production, this would query the Vendor model and aggregate order data
 * For now, returns mock data with sensible defaults
 *
 * @param vendorId - Vendor ID to fetch metrics for
 */

/**
 * Check if admin has set a manual override for this product
 *
 * @param productId - Product to check for override
 */
export const checkAdminOverride = async (
  productId: Types.ObjectId,
): Promise<BuyBoxOverride | null> => {
  const key = productId.toString();
  const override = overrides.get(key);

  if (!override) {
    return null;
  }

  // Check if override has expired
  if (override.expiresAt && override.expiresAt < new Date()) {
    overrides.delete(key);
    return null;
  }

  return override;
};

/**
 * Set admin override for buy box winner
 *
 * @param override - Override configuration
 */
export const setAdminOverride = async (override: BuyBoxOverride): Promise<void> => {
  const key = override.productId.toString();
  overrides.set(key, override);

  // Invalidate cache for this product
  if (redisClient) {
    const cacheKey = `${CACHE_CONFIG.keyPrefix}${override.productId.toString()}`;
    await redisClient.del(cacheKey);
  }
};

/**
 * Clear admin override for a product
 *
 * @param productId - Product to clear override for
 */
export const clearAdminOverride = async (productId: Types.ObjectId): Promise<void> => {
  const key = productId.toString();
  overrides.delete(key);

  // Invalidate cache
  if (redisClient) {
    const cacheKey = `${CACHE_CONFIG.keyPrefix}${productId.toString()}`;
    await redisClient.del(cacheKey);
  }
};

/**
 * Get cached buy box result from Redis
 *
 * @param productId - Product ID
 */
const getCachedBuyBox = async (productId: Types.ObjectId): Promise<BuyBoxResult | null> => {
  if (!redisClient) {
    return null;
  }

  try {
    const cacheKey = `${CACHE_CONFIG.keyPrefix}${productId.toString()}`;
    const cached = await redisClient.get(cacheKey);

    if (!cached) {
      return null;
    }

    const result = JSON.parse(cached) as BuyBoxResult;

    // Convert string dates back to Date objects
    result.calculatedAt = new Date(result.calculatedAt);
    if (result.cacheExpiresAt) {
      result.cacheExpiresAt = new Date(result.cacheExpiresAt);
    }

    // Convert string ObjectIds back to Types.ObjectId
    result.winnerId = new Types.ObjectId(result.winnerId as any);
    result.allScores = result.allScores.map((score) => ({
      ...score,
      offerId: new Types.ObjectId(score.offerId as any),
      vendorId: new Types.ObjectId(score.vendorId as any),
    }));

    result.source = 'cached';
    return result;
  } catch (error) {
    console.error('Error fetching cached buy box:', error);
    return null;
  }
};

/**
 * Cache buy box result in Redis
 *
 * @param productId - Product ID
 * @param result - Buy box result to cache
 */
const cacheBuyBox = async (productId: Types.ObjectId, result: BuyBoxResult): Promise<void> => {
  if (!redisClient) {
    return;
  }

  try {
    const cacheKey = `${CACHE_CONFIG.keyPrefix}${productId.toString()}`;
    const expiresAt = new Date(Date.now() + CACHE_CONFIG.ttl * 1000);

    const cacheData = {
      ...result,
      cacheExpiresAt: expiresAt,
    };

    await redisClient.setex(cacheKey, CACHE_CONFIG.ttl, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching buy box:', error);
  }
};

/**
 * Calculate buy box winner for a product
 *
 * Main entry point for buy box determination.
 *
 * Algorithm:
 * 1. Check for admin override first
 * 2. Check cache for recent calculation
 * 3. Fetch all active offers for product
 * 4. Fetch vendor metrics for each offer
 * 5. Calculate scores for each offer
 * 6. Determine winner (highest score)
 * 7. Handle tie-breaking (vendor with more reviews)
 * 8. Cache result
 *
 * @param productId - Product ID to calculate buy box for
 * @param forceRecalculate - Skip cache and recalculate
 */
export const calculateBuyBox = async (
  productId: Types.ObjectId,
  forceRecalculate = false,
): Promise<BuyBoxResult | null> => {
  // Step 1: Check for admin override
  const override = await checkAdminOverride(productId);
  if (override) {
    return {
      winnerId: override.offerId,
      winnerScore: 100, // Override always wins
      allScores: [],
      calculatedAt: override.setAt,
      source: 'admin_override',
    };
  }

  // Step 2: Check cache (unless forced recalculation)
  if (!forceRecalculate) {
    const cached = await getCachedBuyBox(productId);
    if (cached) {
      return cached;
    }
  }

  // Step 3: Fetch all active offers for this product
  const offers = await ProductOffer.findActiveOffers(productId);

  if (!offers || offers.length === 0) {
    return null; // No offers available
  }

  // Single offer: automatic winner
  if (offers.length === 1) {
    const singleOffer = offers[0];
    const result: BuyBoxResult = {
      winnerId: new Types.ObjectId(String(singleOffer._id)),
      winnerScore: 100,
      allScores: [
        {
          offerId: new Types.ObjectId(String(singleOffer._id)),
          vendorId: singleOffer.vendorId,
          score: 100,
          breakdown: {
            priceScore: 100,
            vendorRatingScore: 100,
            deliverySLAScore: 100,
            cancellationScore: 100,
            stockScore: 100,
            totalScore: 100,
            normalizedPrice: singleOffer.price,
          },
        },
      ],
      calculatedAt: new Date(),
      source: 'calculated',
    };

    await cacheBuyBox(productId, result);
    return result;
  }

  // Step 4 & 5: Calculate scores for each offer
  const prices = offers.map((o) => o.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const scoredOffers = await Promise.all(
    offers.map(async (offer) => {
      const vendorMetrics = await fetchVendorMetrics(offer.vendorId);
      const breakdown = calculateOfferScore(offer, vendorMetrics, minPrice, maxPrice);

      return {
        offerId: new Types.ObjectId(String(offer._id)),
        vendorId: offer.vendorId,
        score: breakdown.totalScore,
        breakdown,
        vendorMetrics, // For tie-breaking
      };
    }),
  );

  // Step 6: Sort by score descending
  scoredOffers.sort((a, b) => b.score - a.score);

  // Step 7: Handle tie-breaking
  // If top scores are very close (within 0.5 points), use vendor with more reviews
  const winner = scoredOffers[0];
  const runnerUp = scoredOffers[1];

  if (runnerUp && Math.abs(winner.score - runnerUp.score) < 0.5) {
    // Tie! Use vendor with more reviews as tie-breaker
    if (runnerUp.vendorMetrics.totalReviews > winner.vendorMetrics.totalReviews) {
      // Runner-up has more reviews, promote them to winner
      scoredOffers[0] = runnerUp;
      scoredOffers[1] = winner;
    }
  }

  // Step 8: Build result and cache
  const result: BuyBoxResult = {
    winnerId: new Types.ObjectId(String(scoredOffers[0].offerId)),
    winnerScore: scoredOffers[0].score,
    allScores: scoredOffers.map(({ vendorMetrics, ...rest }) => ({
      ...rest,
      offerId: new Types.ObjectId(String(rest.offerId)),
    })), // Remove metrics and ensure offerId is ObjectId
    calculatedAt: new Date(),
    source: 'calculated',
  };

  await cacheBuyBox(productId, result);
  return result;
};

/**
 * Get buy box winner ID only (lightweight)
 *
 * Useful for simple "add to cart" flows where only winner ID is needed
 *
 * @param productId - Product ID
 */
export const getBuyBoxWinner = async (
  productId: Types.ObjectId,
): Promise<Types.ObjectId | null> => {
  const result = await calculateBuyBox(productId);
  return result ? result.winnerId : null;
};

/**
 * Invalidate buy box cache for a product
 *
 * Call this when:
 * - New offer added
 * - Offer price/stock updated
 * - Vendor metrics change significantly
 *
 * @param productId - Product ID to invalidate
 */
export const invalidateBuyBoxCache = async (productId: Types.ObjectId): Promise<void> => {
  if (!redisClient) {
    return;
  }

  try {
    const cacheKey = `${CACHE_CONFIG.keyPrefix}${productId.toString()}`;
    await redisClient.del(cacheKey);
  } catch (error) {
    console.error('Error invalidating buy box cache:', error);
  }
};

export const fetchVendorMetrics = async (_vendorId?: Types.ObjectId): Promise<VendorMetrics> => {
  // TODO: Replace with actual Vendor model query
  // const vendor = await Vendor.findById(vendorId);
  // const metrics = await OrderMetrics.aggregate([...]);

  // Mock data for now (would come from Vendor model + analytics)
  return {
    rating: 4.2, // Default: good but not perfect
    totalReviews: 150,
    cancellationRate: 0.02, // 2% cancellation rate
    orderDefectRate: 0.01, // 1% defect rate
  };
};

/**
 * Batch calculate buy boxes for multiple products
 *
 * Useful for category pages or search results
 *
 * @param productIds - Array of product IDs
 */
export const batchCalculateBuyBox = async (
  productIds: Types.ObjectId[],
): Promise<Map<string, BuyBoxResult | null>> => {
  const results = new Map<string, BuyBoxResult | null>();

  await Promise.all(
    productIds.map(async (productId) => {
      const result = await calculateBuyBox(productId);
      results.set(productId.toString(), result);
    }),
  );

  return results;
};
