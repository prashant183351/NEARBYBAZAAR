import {
  calculateOfferScore,
  calculatePriceScore,
  calculateVendorRatingScore,
  calculateDeliverySLAScore,
  calculateCancellationScore,
  calculateStockScore,
  checkAdminOverride,
  setAdminOverride,
  clearAdminOverride,
  fetchVendorMetrics,
} from '../src/services/buyBox';
import { Types } from 'mongoose';

describe('BuyBox Service', () => {
  it('should calculate price score', () => {
    // (offerPrice, minPrice, maxPrice)
    expect(calculatePriceScore(100, 100, 200)).toBe(100);
    expect(calculatePriceScore(200, 100, 200)).toBe(0);
    expect(calculatePriceScore(150, 100, 200)).toBe(50);
    expect(calculatePriceScore(100, 100, 100)).toBe(100);
  });

  it('should calculate vendor rating score', () => {
    expect(calculateVendorRatingScore(4.5)).toBeCloseTo((4.5 / 5) * 100, 1);
    expect(calculateVendorRatingScore(0)).toBe(0);
  });

  it('should calculate delivery SLA score', () => {
    expect(calculateDeliverySLAScore(1)).toBe(100);
    expect(calculateDeliverySLAScore(30)).toBe(0);
    expect(calculateDeliverySLAScore(15)).toBeGreaterThan(0);
  });

  it('should calculate cancellation score', () => {
    expect(calculateCancellationScore(0)).toBe(100);
    expect(calculateCancellationScore(1)).toBe(0);
    expect(calculateCancellationScore(0.5)).toBe(50);
  });

  it('should calculate stock score', () => {
    expect(calculateStockScore(0)).toBe(0);
    const stock10 = calculateStockScore(10);
    expect(stock10).toBeGreaterThan(30);
    expect(stock10).toBeLessThan(40);
    expect(calculateStockScore(1000)).toBeCloseTo(100, 0);
  });

  it('should calculate offer score', () => {
    const offer = { price: 100, slaInDays: 3, handlingTimeInDays: 2, stockQuantity: 10 };
    const vendorMetrics = { rating: 4.5, totalReviews: 100, cancellationRate: 0.05 };
    const breakdown = calculateOfferScore(offer, vendorMetrics, 90, 110);
    expect(breakdown.totalScore).toBeGreaterThan(0);
    expect(breakdown.priceScore).toBeGreaterThan(0);
  });

  it('should handle admin override logic', async () => {
    const productId = new Types.ObjectId();
    const offerId = new Types.ObjectId();
    const vendorId = new Types.ObjectId();
    const setBy = new Types.ObjectId();
    const override = {
      productId,
      offerId,
      vendorId,
      reason: 'test',
      setBy,
      setAt: new Date(),
      expiresAt: new Date(Date.now() + 10000),
    };
    await setAdminOverride(override);
    const result = await checkAdminOverride(productId);
    expect(result).toBeDefined();
    expect(result?.offerId.toString()).toBe(offerId.toString());
    await clearAdminOverride(productId);
    const cleared = await checkAdminOverride(productId);
    expect(cleared).toBeNull();
  });

  it('should fetch vendor metrics', async () => {
    const metrics = await fetchVendorMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.rating).toBeGreaterThan(0);
  });

  // Integration: getBuyBoxWinner, batchCalculateBuyBox, calculateBuyBox
  it.skip('should calculate buy box winner (integration)', async () => {
    // Skipped: requires DB/mocks
  });

  it.skip('should batch calculate buy box', async () => {
    // Skipped: requires DB/mocks
  });

  it.skip('should calculate buy box for a product', async () => {
    // Skipped: requires DB/mocks
  });
});
