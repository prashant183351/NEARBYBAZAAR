/**
 * Buy Box Service Tests - Feature #183
 *
 * Tests for buy box scoring algorithm, caching, and admin overrides
 *
 * Test Coverage:
 * - Scoring algorithm (price, vendor rating, SLA, cancellation, stock)
 * - Tie-breaking logic
 * - Extreme scenarios (very cheap vs very high rated)
 * - Edge cases (no offers, single offer, all same price)
 * - Caching behavior
 * - Admin overrides
 */

import { Types } from 'mongoose';
import {
  calculatePriceScore,
  calculateVendorRatingScore,
  calculateDeliverySLAScore,
  calculateCancellationScore,
  calculateStockScore,
  calculateOfferScore,
  calculateBuyBox,
  setAdminOverride,
  clearAdminOverride,
  checkAdminOverride,
  SCORING_WEIGHTS,
} from '../src/services/buyBox';
import { ProductOffer } from '../src/models/ProductOffer';

// Mock ProductOffer model
jest.mock('../src/models/ProductOffer');

// ==================== HELPER FUNCTIONS ====================

/**
 * Create mock offer for testing
 */
const createMockOffer = (overrides: any = {}) => ({
  _id: new Types.ObjectId(),
  productId: new Types.ObjectId(),
  vendorId: new Types.ObjectId(),
  price: 1000,
  compareAtPrice: 1200,
  stockQuantity: 50,
  slaInDays: 5,
  handlingTimeInDays: 2,
  status: 'active',
  isAvailable: true,
  condition: 'new',
  fulfillmentMethod: 'FBM',
  ...overrides,
});

/**
 * Create mock vendor metrics
 */
const createMockVendorMetrics = (overrides: any = {}) => ({
  rating: 4.0,
  totalReviews: 100,
  cancellationRate: 0.05,
  orderDefectRate: 0.02,
  ...overrides,
});

// ==================== PRICE SCORING TESTS ====================

describe('Buy Box Service - Price Scoring', () => {
  it('should give 100 to cheapest offer', () => {
    const score = calculatePriceScore(500, 500, 1000);
    expect(score).toBe(100);
  });

  it('should give 0 to most expensive offer', () => {
    const score = calculatePriceScore(1000, 500, 1000);
    expect(score).toBe(0);
  });

  it('should give 50 to mid-priced offer', () => {
    const score = calculatePriceScore(750, 500, 1000);
    expect(score).toBe(50);
  });

  it('should handle all offers same price', () => {
    const score = calculatePriceScore(1000, 1000, 1000);
    expect(score).toBe(100); // All equal = all get perfect score
  });

  it('should clamp scores to 0-100 range', () => {
    // Edge case shouldn't produce negative or >100
    const score1 = calculatePriceScore(400, 500, 1000);
    expect(score1).toBeGreaterThanOrEqual(0);
    expect(score1).toBeLessThanOrEqual(100);

    const score2 = calculatePriceScore(1100, 500, 1000);
    expect(score2).toBeGreaterThanOrEqual(0);
    expect(score2).toBeLessThanOrEqual(100);
  });
});

// ==================== VENDOR RATING TESTS ====================

describe('Buy Box Service - Vendor Rating Scoring', () => {
  it('should convert 5-star rating to 100', () => {
    const score = calculateVendorRatingScore(5.0);
    expect(score).toBe(100);
  });

  it('should convert 0-star rating to 0', () => {
    const score = calculateVendorRatingScore(0);
    expect(score).toBe(0);
  });

  it('should convert 2.5-star rating to 50', () => {
    const score = calculateVendorRatingScore(2.5);
    expect(score).toBe(50);
  });

  it('should convert 4.2-star rating correctly', () => {
    const score = calculateVendorRatingScore(4.2);
    expect(score).toBeCloseTo(84, 0); // 4.2/5 * 100 = 84
  });

  it('should clamp negative ratings to 0', () => {
    const score = calculateVendorRatingScore(-1);
    expect(score).toBe(0);
  });

  it('should clamp >5 ratings to 100', () => {
    const score = calculateVendorRatingScore(6);
    expect(score).toBe(100);
  });
});

// ==================== DELIVERY SLA TESTS ====================

describe('Buy Box Service - Delivery SLA Scoring', () => {
  it('should give 100 to 1-day delivery', () => {
    const score = calculateDeliverySLAScore(1);
    expect(score).toBe(100);
  });

  it('should give 0 to 30-day delivery', () => {
    const score = calculateDeliverySLAScore(30);
    expect(score).toBe(0);
  });

  it('should give ~50 to 15-day delivery (mid-range)', () => {
    const score = calculateDeliverySLAScore(15);
    expect(score).toBeCloseTo(51.7, 0); // Approximately mid-range
  });

  it('should handle same-day delivery (0 days)', () => {
    const score = calculateDeliverySLAScore(0);
    expect(score).toBe(100); // Clamped to min of 1, gets 100
  });

  it('should clamp very long delivery times', () => {
    const score = calculateDeliverySLAScore(90);
    expect(score).toBe(0); // Clamped to max of 30, gets 0
  });
});

// ==================== CANCELLATION SCORE TESTS ====================

describe('Buy Box Service - Cancellation Rate Scoring', () => {
  it('should give 100 to 0% cancellation rate', () => {
    const score = calculateCancellationScore(0);
    expect(score).toBe(100);
  });

  it('should give 0 to 100% cancellation rate', () => {
    const score = calculateCancellationScore(1);
    expect(score).toBe(0);
  });

  it('should give 95 to 5% cancellation rate', () => {
    const score = calculateCancellationScore(0.05);
    expect(score).toBe(95);
  });

  it('should give 90 to 10% cancellation rate', () => {
    const score = calculateCancellationScore(0.1);
    expect(score).toBe(90);
  });
});

// ==================== STOCK SCORE TESTS ====================

describe('Buy Box Service - Stock Level Scoring', () => {
  it('should give 0 to zero stock', () => {
    const score = calculateStockScore(0);
    expect(score).toBe(0);
  });

  it('should give higher score to higher stock', () => {
    const score1 = calculateStockScore(10);
    const score100 = calculateStockScore(100);
    const score1000 = calculateStockScore(1000);

    expect(score100).toBeGreaterThan(score1);
    expect(score1000).toBeGreaterThan(score100);
  });

  it('should use logarithmic scale (prevent huge stock dominating)', () => {
    const score1 = calculateStockScore(1);
    const score100 = calculateStockScore(100);
    const score1000 = calculateStockScore(1000);
    const score10000 = calculateStockScore(10000);

    // Verify increasing stock increases score
    expect(score100).toBeGreaterThan(score1);
    expect(score1000).toBeGreaterThan(score100);

    // 1000 should cap at same as 10000 due to log scale
    expect(score1000).toBeCloseTo(score10000, 0);
  });
});

// ==================== COMPREHENSIVE SCORING TESTS ====================

describe('Buy Box Service - Comprehensive Offer Scoring', () => {
  it('should calculate total score with correct weights', () => {
    const offer = createMockOffer({
      price: 750, // Mid-range in 500-1000
    });

    const vendorMetrics = createMockVendorMetrics({
      rating: 4.0,
      cancellationRate: 0.05,
    });

    const breakdown = calculateOfferScore(offer, vendorMetrics, 500, 1000);

    // Verify individual scores are calculated
    expect(breakdown.priceScore).toBe(50); // Mid-range
    expect(breakdown.vendorRatingScore).toBe(80); // 4.0/5 * 100
    expect(breakdown.deliverySLAScore).toBeGreaterThan(0);
    expect(breakdown.cancellationScore).toBe(95); // 1 - 0.05
    expect(breakdown.stockScore).toBeGreaterThan(0);

    // Verify total score is weighted sum
    const expectedTotal =
      breakdown.priceScore * SCORING_WEIGHTS.price +
      breakdown.vendorRatingScore * SCORING_WEIGHTS.vendorRating +
      breakdown.deliverySLAScore * SCORING_WEIGHTS.deliverySLA +
      breakdown.cancellationScore * SCORING_WEIGHTS.cancellationRate +
      breakdown.stockScore * SCORING_WEIGHTS.stockLevel;

    expect(breakdown.totalScore).toBeCloseTo(expectedTotal, 1);
  });

  it('should return score between 0-100', () => {
    const offer = createMockOffer();
    const vendorMetrics = createMockVendorMetrics();

    const breakdown = calculateOfferScore(offer, vendorMetrics, 500, 1000);

    expect(breakdown.totalScore).toBeGreaterThanOrEqual(0);
    expect(breakdown.totalScore).toBeLessThanOrEqual(100);
  });
});

// ==================== BUY BOX CALCULATION TESTS ====================

describe('Buy Box Service - Buy Box Calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when no offers available', async () => {
    (ProductOffer.findActiveOffers as jest.Mock).mockResolvedValue([]);

    const productId = new Types.ObjectId();
    const result = await calculateBuyBox(productId);

    expect(result).toBeNull();
  });

  it('should automatically select single offer as winner', async () => {
    const offer = createMockOffer();
    (ProductOffer.findActiveOffers as jest.Mock).mockResolvedValue([offer]);

    const productId = new Types.ObjectId();
    const result = await calculateBuyBox(productId);

    expect(result).not.toBeNull();
    expect(result!.winnerId).toEqual(offer._id);
    expect(result!.winnerScore).toBe(100);
    expect(result!.allScores.length).toBe(1);
  });

  it('CRITICAL: should select cheapest offer with similar vendor ratings', async () => {
    const cheapOffer = createMockOffer({
      price: 800,
      _id: new Types.ObjectId(),
    });

    const expensiveOffer = createMockOffer({
      price: 1200,
      _id: new Types.ObjectId(),
    });

    (ProductOffer.findActiveOffers as jest.Mock).mockResolvedValue([cheapOffer, expensiveOffer]);

    const productId = new Types.ObjectId();
    const result = await calculateBuyBox(productId);

    expect(result).not.toBeNull();
    // Cheapest should win (price has 40% weight)
    expect(result!.winnerId).toEqual(cheapOffer._id);
    expect(result!.allScores.length).toBe(2);
  });

  it('CRITICAL: should balance price vs vendor rating correctly', async () => {
    // Cheap but low-rated vendor
    const cheapOffer = createMockOffer({
      price: 700,
      vendorId: new Types.ObjectId('111111111111111111111111'),
      _id: new Types.ObjectId(),
    });

    // Expensive but high-rated vendor
    const premiumOffer = createMockOffer({
      price: 900,
      vendorId: new Types.ObjectId('222222222222222222222222'),
      _id: new Types.ObjectId(),
    });

    (ProductOffer.findActiveOffers as jest.Mock).mockResolvedValue([cheapOffer, premiumOffer]);

    // Mock vendor metrics: cheap vendor has 3.0 rating, premium has 5.0
    jest
      .spyOn(require('../src/services/buyBox'), 'fetchVendorMetrics')
      .mockImplementation(async (vendorId: any) => {
        if (vendorId.toString() === '111111111111111111111111') {
          return createMockVendorMetrics({ rating: 3.0, cancellationRate: 0.1 });
        }
        return createMockVendorMetrics({ rating: 5.0, cancellationRate: 0.01 });
      });

    const productId = new Types.ObjectId();
    const result = await calculateBuyBox(productId);

    expect(result).not.toBeNull();
    expect(result!.allScores.length).toBe(2);

    // Both should have scores calculated
    const cheapScore = result!.allScores.find((s) => s.offerId.equals(cheapOffer._id));
    const premiumScore = result!.allScores.find((s) => s.offerId.equals(premiumOffer._id));

    expect(cheapScore).toBeDefined();
    expect(premiumScore).toBeDefined();

    // Winner depends on weighted algorithm
    // Price: 40% weight - cheap wins by (900-700)/(900-700) * 40 = 40 points
    // Rating: 25% weight - premium wins by (5-3)/5 * 25 = 10 points
    // Cheap should win overall (40 > 10)
    expect(result!.winnerId).toEqual(cheapOffer._id);
  });

  it('CRITICAL: Extreme scenario - very cheap but terrible rating vs expensive excellent rating', async () => {
    // Super cheap but terrible vendor (50% off market)
    const bargainOffer = createMockOffer({
      price: 500,
      vendorId: new Types.ObjectId('111111111111111111111111'),
      _id: new Types.ObjectId(),
    });

    // Premium price but perfect vendor
    const premiumOffer = createMockOffer({
      price: 1000,
      vendorId: new Types.ObjectId('222222222222222222222222'),
      _id: new Types.ObjectId(),
    });

    (ProductOffer.findActiveOffers as jest.Mock).mockResolvedValue([bargainOffer, premiumOffer]);

    // Bargain: 1.5 rating, 20% cancellation
    // Premium: 5.0 rating, 0% cancellation
    jest
      .spyOn(require('../src/services/buyBox'), 'fetchVendorMetrics')
      .mockImplementation(async (vendorId: any) => {
        if (vendorId.toString() === '111111111111111111111111') {
          return createMockVendorMetrics({
            rating: 1.5,
            cancellationRate: 0.2,
            totalReviews: 50,
          });
        }
        return createMockVendorMetrics({
          rating: 5.0,
          cancellationRate: 0.0,
          totalReviews: 500,
        });
      });

    const productId = new Types.ObjectId();
    const result = await calculateBuyBox(productId);

    expect(result).not.toBeNull();

    const bargainScore = result!.allScores.find((s) => s.offerId.equals(bargainOffer._id));
    const premiumScore = result!.allScores.find((s) => s.offerId.equals(premiumOffer._id));

    // Bargain gets full price points (100 * 0.40 = 40)
    // But loses heavily on rating (30 * 0.25 = 7.5) and cancellation (80 * 0.10 = 8)
    // Premium gets 0 price points but 100 on rating (25) and cancellation (10)

    // This test validates the algorithm makes a reasonable choice
    // Both should have meaningful scores
    expect(bargainScore!.score).toBeGreaterThan(0);
    expect(premiumScore!.score).toBeGreaterThan(0);

    // Log for manual inspection
    console.log('Extreme scenario scores:', {
      bargain: bargainScore!.score,
      premium: premiumScore!.score,
    });
  });

  it('CRITICAL: Tie-breaker - should use vendor with more reviews', async () => {
    const offer1 = createMockOffer({
      price: 1000,
      vendorId: new Types.ObjectId('111111111111111111111111'),
      _id: new Types.ObjectId(),
    });

    const offer2 = createMockOffer({
      price: 1000,
      vendorId: new Types.ObjectId('222222222222222222222222'),
      _id: new Types.ObjectId(),
    });

    (ProductOffer.findActiveOffers as jest.Mock).mockResolvedValue([offer1, offer2]);

    // Both vendors identical except review count
    jest
      .spyOn(require('../src/services/buyBox'), 'fetchVendorMetrics')
      .mockImplementation(async (vendorId: any) => {
        if (vendorId.toString() === '111111111111111111111111') {
          return createMockVendorMetrics({ rating: 4.5, totalReviews: 50 });
        }
        return createMockVendorMetrics({ rating: 4.5, totalReviews: 500 });
      });

    const productId = new Types.ObjectId();
    const result = await calculateBuyBox(productId);

    expect(result).not.toBeNull();

    // Vendor with more reviews should win tie (offer2 has 500 reviews)
    expect(result!.winnerId).toEqual(offer2._id);
  });

  it('should handle offers with different fulfillment methods', async () => {
    const fbaOffer = createMockOffer({
      fulfillmentMethod: 'FBA',
      slaInDays: 2,
      _id: new Types.ObjectId(),
    });

    const fbmOffer = createMockOffer({
      fulfillmentMethod: 'FBM',
      slaInDays: 7,
      _id: new Types.ObjectId(),
    });

    const dropshipOffer = createMockOffer({
      fulfillmentMethod: 'dropship',
      slaInDays: 14,
      _id: new Types.ObjectId(),
    });

    (ProductOffer.findActiveOffers as jest.Mock).mockResolvedValue([
      fbaOffer,
      fbmOffer,
      dropshipOffer,
    ]);

    const productId = new Types.ObjectId();
    const result = await calculateBuyBox(productId);

    expect(result).not.toBeNull();
    expect(result!.allScores.length).toBe(3);

    // FBA (fastest) should score highest on delivery SLA
    const fbaScore = result!.allScores.find((s) => s.offerId.equals(fbaOffer._id));
    const fbmScore = result!.allScores.find((s) => s.offerId.equals(fbmOffer._id));
    const dropshipScore = result!.allScores.find((s) => s.offerId.equals(dropshipOffer._id));

    expect(fbaScore!.breakdown.deliverySLAScore).toBeGreaterThan(
      fbmScore!.breakdown.deliverySLAScore,
    );
    expect(fbmScore!.breakdown.deliverySLAScore).toBeGreaterThan(
      dropshipScore!.breakdown.deliverySLAScore,
    );
  });
});

// ==================== ADMIN OVERRIDE TESTS ====================

describe('Buy Box Service - Admin Overrides', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set admin override successfully', async () => {
    const productId = new Types.ObjectId();
    const offerId = new Types.ObjectId();
    const adminId = new Types.ObjectId();

    const override = {
      productId,
      offerId,
      vendorId: new Types.ObjectId(),
      reason: 'Promotional campaign',
      setBy: adminId,
      setAt: new Date(),
    };

    await setAdminOverride(override);

    const retrieved = await checkAdminOverride(productId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.offerId).toEqual(offerId);
    expect(retrieved!.reason).toBe('Promotional campaign');
  });

  it('should clear admin override successfully', async () => {
    const productId = new Types.ObjectId();
    const offerId = new Types.ObjectId();

    const override = {
      productId,
      offerId,
      vendorId: new Types.ObjectId(),
      reason: 'Test',
      setBy: new Types.ObjectId(),
      setAt: new Date(),
    };

    await setAdminOverride(override);
    await clearAdminOverride(productId);

    const retrieved = await checkAdminOverride(productId);
    expect(retrieved).toBeNull();
  });

  it('should respect expiration date on overrides', async () => {
    const productId = new Types.ObjectId();
    const offerId = new Types.ObjectId();

    // Set override that expired 1 hour ago
    const override = {
      productId,
      offerId,
      vendorId: new Types.ObjectId(),
      reason: 'Expired promotion',
      setBy: new Types.ObjectId(),
      setAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    };

    await setAdminOverride(override);

    const retrieved = await checkAdminOverride(productId);
    expect(retrieved).toBeNull(); // Expired, should be null
  });

  it('should return override result with source="admin_override"', async () => {
    const productId = new Types.ObjectId();
    const offerId = new Types.ObjectId();

    const override = {
      productId,
      offerId,
      vendorId: new Types.ObjectId(),
      reason: 'Manual selection',
      setBy: new Types.ObjectId(),
      setAt: new Date(),
    };

    await setAdminOverride(override);

    const result = await calculateBuyBox(productId);

    expect(result).not.toBeNull();
    expect(result!.source).toBe('admin_override');
    expect(result!.winnerId).toEqual(offerId);
    expect(result!.winnerScore).toBe(100); // Overrides always win
  });
});

// ==================== EDGE CASES ====================

describe('Buy Box Service - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle product with no active offers', async () => {
    (ProductOffer.findActiveOffers as jest.Mock).mockResolvedValue([]);

    const result = await calculateBuyBox(new Types.ObjectId());
    expect(result).toBeNull();
  });

  it('should handle all offers with same price and rating', async () => {
    const offer1 = createMockOffer({ _id: new Types.ObjectId() });
    const offer2 = createMockOffer({ _id: new Types.ObjectId() });
    const offer3 = createMockOffer({ _id: new Types.ObjectId() });

    (ProductOffer.findActiveOffers as jest.Mock).mockResolvedValue([offer1, offer2, offer3]);

    const result = await calculateBuyBox(new Types.ObjectId());

    expect(result).not.toBeNull();
    expect(result!.allScores.length).toBe(3);

    // All should have identical or very close scores
    const scores = result!.allScores.map((s) => s.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    expect(maxScore - minScore).toBeLessThan(1); // Difference < 1 point
  });

  it('should handle offers with missing vendor metrics gracefully', async () => {
    const offer = createMockOffer();
    (ProductOffer.findActiveOffers as jest.Mock).mockResolvedValue([offer]);

    // Mock returns default metrics
    const result = await calculateBuyBox(new Types.ObjectId());

    expect(result).not.toBeNull();
    expect(result!.winnerId).toEqual(offer._id);
  });
});

// ==================== SCORING WEIGHT VALIDATION ====================

describe('Buy Box Service - Scoring Weights Configuration', () => {
  it('should have weights that sum to 1.0 (100%)', () => {
    const sum =
      SCORING_WEIGHTS.price +
      SCORING_WEIGHTS.vendorRating +
      SCORING_WEIGHTS.deliverySLA +
      SCORING_WEIGHTS.cancellationRate +
      SCORING_WEIGHTS.stockLevel;

    expect(sum).toBeCloseTo(1.0, 5); // Within 0.00001 tolerance
  });

  it('should have price as highest weight', () => {
    const weights = Object.values(SCORING_WEIGHTS);
    const maxWeight = Math.max(...weights);
    expect(SCORING_WEIGHTS.price).toBe(maxWeight);
  });

  it('should have stock as lowest weight', () => {
    const weights = Object.values(SCORING_WEIGHTS);
    const minWeight = Math.min(...weights);
    expect(SCORING_WEIGHTS.stockLevel).toBe(minWeight);
  });
});
