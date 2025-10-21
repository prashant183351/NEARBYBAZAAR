/**
 * Feature #181: Pricing Engine Tests
 * 
 * CRITICAL TEST REQUIREMENTS (from spec):
 * - Test stacking rules and exclusion (some coupons not combinable with others)
 * - Test tiered pricing for bulk purchases
 * - Verify explanation breakdown for UI display
 */

import { Types } from 'mongoose';
import { PricingEngine, CartItem } from '../src/services/pricingEngine';
import { IPricingRule } from '../src/models/PricingRule';

// Mock PricingRule model
jest.mock('../src/models/PricingRule', () => ({
  PricingRule: {
    findByCode: jest.fn(),
    findApplicableRules: jest.fn(),
    findActivePromotions: jest.fn(),
  },
}));

const { PricingRule } = require('../src/models/PricingRule');

describe('Feature #181: Pricing Engine', () => {
  // Sample cart items
  const sampleItems: CartItem[] = [
    {
      productId: new Types.ObjectId(),
      sku: 'PHONE-001',
      name: 'Smartphone X',
      categoryId: new Types.ObjectId(),
      vendorId: new Types.ObjectId(),
      quantity: 1,
      unitPrice: 20000,
      originalTotal: 20000,
    },
    {
      productId: new Types.ObjectId(),
      sku: 'CASE-001',
      name: 'Phone Case',
      categoryId: new Types.ObjectId(),
      vendorId: new Types.ObjectId(),
      quantity: 2,
      unitPrice: 500,
      originalTotal: 1000,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CRITICAL: Stacking Rules', () => {
    it('should apply multiple stackable rules', async () => {
      // Rule 1: Stackable 10% off
      const rule1: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Platform Sale',
        type: 'promotion',
        status: 'active',
        priority: 50,
        stackable: true,
        discount: { type: 'percentage', value: 10 },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
      } as IPricingRule;

      // Rule 2: Stackable coupon ₹500 off
      const rule2: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Welcome Coupon',
        type: 'coupon',
        code: 'WELCOME500',
        status: 'active',
        priority: 40,
        stackable: true,
        discount: { type: 'fixed', value: 500 },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
        hasReachedUsageLimit: () => false,
        incrementUsage: jest.fn(),
      } as any;

      PricingRule.findByCode.mockResolvedValue(rule2);
      PricingRule.findApplicableRules.mockResolvedValue([rule1]);

      const result = await PricingEngine.evaluateCart(sampleItems, ['WELCOME500']);

      // Cart total: ₹21,000
      // Rule1 (10%): ₹2,100 off
      // Rule2 (fixed): ₹500 off
      // Total discount: ₹2,600
      expect(result.originalTotal).toBe(21000);
      expect(result.discountTotal).toBe(2600);
      expect(result.finalTotal).toBe(18400);
      expect(result.appliedDiscounts).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('CRITICAL: should NOT stack non-stackable coupon with promo', async () => {
      // Non-stackable coupon
      const rule1: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Exclusive Coupon',
        type: 'coupon',
        code: 'EXCLUSIVE20',
        status: 'active',
        priority: 60,
        stackable: false, // Cannot stack!
        discount: { type: 'percentage', value: 20 },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
        hasReachedUsageLimit: () => false,
      } as any;

      // Auto-applied promo
      const rule2: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Electronics Sale',
        type: 'promotion',
        status: 'active',
        priority: 50,
        stackable: true,
        discount: { type: 'percentage', value: 5 },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
      } as IPricingRule;

      PricingRule.findByCode.mockResolvedValue(rule1);
      PricingRule.findApplicableRules.mockResolvedValue([rule2]);

      const result = await PricingEngine.evaluateCart(sampleItems, ['EXCLUSIVE20']);

      // Only the higher-priority non-stackable coupon should apply
      expect(result.appliedDiscounts).toHaveLength(1);
      expect(result.appliedDiscounts[0].ruleType).toBe('coupon');
      expect(result.warnings).toContain('Rule "Electronics Sale" cannot be stacked with other discounts');
      
      // Cart total: ₹21,000
      // Only 20% coupon applied: ₹4,200 off
      expect(result.discountTotal).toBe(4200);
    });

    it('should respect stackableWith whitelist', async () => {
      const rule1Id = new Types.ObjectId();
      const rule2Id = new Types.ObjectId();

      // Rule 1: Only stackable with rule2
      const rule1: Partial<IPricingRule> = {
        _id: rule1Id,
        name: 'Category Discount',
        type: 'promotion',
        status: 'active',
        priority: 50,
        stackable: true,
        stackableWith: [rule2Id], // Only with rule2
        discount: { type: 'percentage', value: 10 },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
      } as IPricingRule;

      // Rule 2: Compatible
      const rule2: Partial<IPricingRule> = {
        _id: rule2Id,
        name: 'Brand Loyalty',
        type: 'promotion',
        status: 'active',
        priority: 40,
        stackable: true,
        discount: { type: 'fixed', value: 300 },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
      } as IPricingRule;

      // Rule 3: Not in whitelist
      const rule3: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Other Promo',
        type: 'promotion',
        status: 'active',
        priority: 30,
        stackable: true,
        discount: { type: 'percentage', value: 5 },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
      } as IPricingRule;

      PricingRule.findByCode.mockResolvedValue(null);
      PricingRule.findApplicableRules.mockResolvedValue([rule1, rule2, rule3]);

      const result = await PricingEngine.evaluateCart(sampleItems);

      // Rule1 and Rule2 should apply (whitelist match)
      // Rule3 should be rejected (not in stackableWith)
      expect(result.appliedDiscounts).toHaveLength(2);
      expect(result.appliedDiscounts.map(d => d.ruleName)).toContain('Category Discount');
      expect(result.appliedDiscounts.map(d => d.ruleName)).toContain('Brand Loyalty');
      expect(result.warnings).toContain('Rule "Other Promo" can only stack with specific rules');
    });
  });

  describe('CRITICAL: Tiered Pricing (Bulk Discounts)', () => {
    it('should apply correct tier based on quantity', async () => {
      const bulkItems: CartItem[] = [
        {
          productId: new Types.ObjectId(),
          sku: 'WIDGET-001',
          name: 'Widget',
          quantity: 25, // Tier 2: 15% off
          unitPrice: 100,
          originalTotal: 2500,
        },
      ];

      const tieredRule: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Bulk Discount',
        type: 'tiered',
        status: 'active',
        priority: 50,
        stackable: false,
        discount: {
          type: 'tiered',
          tiers: [
            { minQuantity: 10, maxQuantity: 24, discountPercentage: 10 }, // Tier 1
            { minQuantity: 25, maxQuantity: 49, discountPercentage: 15 }, // Tier 2
            { minQuantity: 50, discountPercentage: 20 }, // Tier 3
          ],
        },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
      } as IPricingRule;

      PricingRule.findByCode.mockResolvedValue(null);
      PricingRule.findApplicableRules.mockResolvedValue([tieredRule]);

      const result = await PricingEngine.evaluateCart(bulkItems);

      // Quantity: 25 -> Tier 2 (15% off)
      // Discount: ₹2,500 * 0.15 = ₹375
      expect(result.discountTotal).toBe(375);
      expect(result.appliedDiscounts[0].explanation).toContain('15%');
    });

    it('should apply price override tier', async () => {
      const bulkItems: CartItem[] = [
        {
          productId: new Types.ObjectId(),
          sku: 'WIDGET-002',
          name: 'Premium Widget',
          quantity: 100,
          unitPrice: 150,
          originalTotal: 15000,
        },
      ];

      const tieredRule: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Wholesale Pricing',
        type: 'tiered',
        status: 'active',
        priority: 50,
        stackable: false,
        discount: {
          type: 'tiered',
          tiers: [
            { minQuantity: 50, maxQuantity: 99, pricePerUnit: 130 }, // ₹130/unit
            { minQuantity: 100, pricePerUnit: 120 }, // ₹120/unit
          ],
        },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
      } as IPricingRule;

      PricingRule.findByCode.mockResolvedValue(null);
      PricingRule.findApplicableRules.mockResolvedValue([tieredRule]);

      const result = await PricingEngine.evaluateCart(bulkItems);

      // Original: 100 * ₹150 = ₹15,000
      // New price: 100 * ₹120 = ₹12,000
      // Discount: ₹3,000
      expect(result.discountTotal).toBe(3000);
      expect(result.finalTotal).toBe(12000);
    });

    it('should handle no matching tier (quantity too low)', async () => {
      const bulkItems: CartItem[] = [
        {
          productId: new Types.ObjectId(),
          sku: 'WIDGET-003',
          name: 'Widget',
          quantity: 5, // Below min tier (10)
          unitPrice: 100,
          originalTotal: 500,
        },
      ];

      const tieredRule: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Bulk Discount',
        type: 'tiered',
        status: 'active',
        priority: 50,
        stackable: false,
        discount: {
          type: 'tiered',
          tiers: [
            { minQuantity: 10, discountPercentage: 10 },
          ],
        },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
      } as IPricingRule;

      PricingRule.findByCode.mockResolvedValue(null);
      PricingRule.findApplicableRules.mockResolvedValue([tieredRule]);

      const result = await PricingEngine.evaluateCart(bulkItems);

      // No tier matches, so no discount
      expect(result.discountTotal).toBe(0);
      expect(result.appliedDiscounts).toHaveLength(0);
    });
  });

  describe('CRITICAL: Explanation Breakdown', () => {
    it('should generate UI-friendly explanation for coupon', async () => {
      const coupon: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Save 10 Promo',
        type: 'coupon',
        code: 'SAVE10',
        status: 'active',
        priority: 50,
        stackable: false,
        discount: { type: 'percentage', value: 10 },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
        hasReachedUsageLimit: () => false,
      } as any;

      PricingRule.findByCode.mockResolvedValue(coupon);
      PricingRule.findApplicableRules.mockResolvedValue([]);

      const result = await PricingEngine.evaluateCart(sampleItems, ['SAVE10']);

      // Cart total: ₹21,000
      // 10% discount: ₹2,100
      expect(result.appliedDiscounts).toHaveLength(1);
      
      const explanation = result.appliedDiscounts[0].explanation;
      expect(explanation).toContain('Applied Coupon SAVE10');
      expect(explanation).toContain('10%');
      expect(explanation).toContain('-₹2100');
    });

    it('should generate formatted breakdown for multiple rules', async () => {
      const rule1: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Summer Sale',
        type: 'promotion',
        status: 'active',
        priority: 50,
        stackable: true,
        discount: { type: 'percentage', value: 15 },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
      } as IPricingRule;

      const rule2: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'First Order Bonus',
        type: 'coupon',
        code: 'FIRST100',
        status: 'active',
        priority: 40,
        stackable: true,
        discount: { type: 'fixed', value: 100 },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
        hasReachedUsageLimit: () => false,
      } as any;

      PricingRule.findByCode.mockResolvedValue(rule2);
      PricingRule.findApplicableRules.mockResolvedValue([rule1]);

      const result = await PricingEngine.evaluateCart(sampleItems, ['FIRST100']);

      // Format breakdown
      const lines = PricingEngine.formatBreakdown(result);
      
      expect(lines[0]).toContain('Subtotal: ₹21000.00');
      expect(lines.some(line => line.includes('Discounts:'))).toBe(true);
      expect(lines.some(line => line.includes('Summer Sale'))).toBe(true);
      expect(lines.some(line => line.includes('Applied Coupon FIRST100'))).toBe(true);
      expect(lines.some(line => line.includes('Total Savings:'))).toBe(true);
      expect(lines.some(line => line.includes('Total: ₹'))).toBe(true);
    });
  });

  describe('Usage Limits', () => {
    it('should reject coupon that has reached usage limit', async () => {
      const exhaustedCoupon: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Limited Offer',
        type: 'coupon',
        code: 'LIMITED10',
        status: 'active',
        priority: 50,
        stackable: false,
        discount: { type: 'percentage', value: 10 },
        applicableTo: { type: 'all' },
        usageLimits: {
          maxUsageTotal: 100,
          currentUsageTotal: 100, // Reached limit!
        },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
        hasReachedUsageLimit: () => true,
      } as any;

      PricingRule.findByCode.mockResolvedValue(exhaustedCoupon);
      PricingRule.findApplicableRules.mockResolvedValue([]);

      const result = await PricingEngine.evaluateCart(sampleItems, ['LIMITED10']);

      expect(result.errors).toContain('Coupon code "LIMITED10" has reached usage limit');
      expect(result.appliedDiscounts).toHaveLength(0);
    });

    it('should enforce minimum cart value', async () => {
      const highMinCoupon: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Big Spender',
        type: 'coupon',
        code: 'BIG50K',
        status: 'active',
        priority: 50,
        stackable: false,
        discount: { type: 'fixed', value: 5000 },
        applicableTo: { type: 'all' },
        usageLimits: {
          currentUsageTotal: 0,
          minCartValue: 50000, // Requires ₹50k cart
        },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
        hasReachedUsageLimit: () => false,
      } as any;

      PricingRule.findByCode.mockResolvedValue(highMinCoupon);
      PricingRule.findApplicableRules.mockResolvedValue([]);

      // Cart only ₹21,000
      const result = await PricingEngine.evaluateCart(sampleItems, ['BIG50K']);

      expect(result.errors).toContain('Coupon "BIG50K" requires minimum cart value of ₹50000');
      expect(result.appliedDiscounts).toHaveLength(0);
    });

    it('should cap discount at maxDiscountAmount', async () => {
      const cappedRule: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Big Discount',
        type: 'promotion',
        status: 'active',
        priority: 50,
        stackable: false,
        discount: { type: 'percentage', value: 50 }, // 50% off
        applicableTo: { type: 'all' },
        usageLimits: {
          currentUsageTotal: 0,
          maxDiscountAmount: 5000, // Max ₹5k savings
        },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
      } as IPricingRule;

      PricingRule.findByCode.mockResolvedValue(null);
      PricingRule.findApplicableRules.mockResolvedValue([cappedRule]);

      const result = await PricingEngine.evaluateCart(sampleItems);

      // Cart: ₹21,000
      // 50% would be ₹10,500, but capped at ₹5,000
      expect(result.discountTotal).toBe(5000);
      expect(result.warnings).toContain('Discount capped at ₹5000 (max allowed for this rule)');
    });
  });

  describe('Exclusions', () => {
    it('should exclude already-discounted items', async () => {
      const itemsWithSale: CartItem[] = [
        {
          productId: new Types.ObjectId(),
          sku: 'SALE-001',
          name: 'Sale Item',
          quantity: 1,
          unitPrice: 1000,
          originalTotal: 1000,
          isDiscounted: true, // Already on sale
        },
        {
          productId: new Types.ObjectId(),
          sku: 'REGULAR-001',
          name: 'Regular Item',
          quantity: 1,
          unitPrice: 2000,
          originalTotal: 2000,
          isDiscounted: false,
        },
      ];

      const excludeRule: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'No Sale Items',
        type: 'promotion',
        status: 'active',
        priority: 50,
        stackable: false,
        discount: { type: 'percentage', value: 10 },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: true, // Exclude already-discounted
        excludeSaleItems: false,
        isVendorRule: false,
      } as IPricingRule;

      PricingRule.findByCode.mockResolvedValue(null);
      PricingRule.findApplicableRules.mockResolvedValue([excludeRule]);

      const result = await PricingEngine.evaluateCart(itemsWithSale);

      // Only applies to regular item (₹2,000)
      // Discount: ₹200
      expect(result.discountTotal).toBe(200);
    });

    it('should exclude sale items when flag is set', async () => {
      const itemsWithSale: CartItem[] = [
        {
          productId: new Types.ObjectId(),
          sku: 'CLEARANCE-001',
          name: 'Clearance Item',
          quantity: 1,
          unitPrice: 1500,
          originalTotal: 1500,
          isSaleItem: true,
        },
        {
          productId: new Types.ObjectId(),
          sku: 'NORMAL-001',
          name: 'Normal Item',
          quantity: 1,
          unitPrice: 2500,
          originalTotal: 2500,
          isSaleItem: false,
        },
      ];

      const excludeRule: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Regular Items Only',
        type: 'promotion',
        status: 'active',
        priority: 50,
        stackable: false,
        discount: { type: 'percentage', value: 10 },
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: true, // Exclude sale/clearance
        isVendorRule: false,
      } as IPricingRule;

      PricingRule.findByCode.mockResolvedValue(null);
      PricingRule.findApplicableRules.mockResolvedValue([excludeRule]);

      const result = await PricingEngine.evaluateCart(itemsWithSale);

      // Only applies to normal item (₹2,500)
      // Discount: ₹250
      expect(result.discountTotal).toBe(250);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty cart', async () => {
      const result = await PricingEngine.evaluateCart([]);

      expect(result.originalTotal).toBe(0);
      expect(result.discountTotal).toBe(0);
      expect(result.finalTotal).toBe(0);
      expect(result.appliedDiscounts).toHaveLength(0);
    });

    it('should never return negative final total', async () => {
      const smallCart: CartItem[] = [
        {
          productId: new Types.ObjectId(),
          sku: 'CHEAP-001',
          name: 'Cheap Item',
          quantity: 1,
          unitPrice: 100,
          originalTotal: 100,
        },
      ];

      const hugeDiscount: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Huge Discount',
        type: 'promotion',
        status: 'active',
        priority: 50,
        stackable: false,
        discount: { type: 'fixed', value: 10000 }, // Way more than cart value
        applicableTo: { type: 'all' },
        usageLimits: { currentUsageTotal: 0 },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
      } as IPricingRule;

      PricingRule.findByCode.mockResolvedValue(null);
      PricingRule.findApplicableRules.mockResolvedValue([hugeDiscount]);

      const result = await PricingEngine.evaluateCart(smallCart);

      // Final total should be 0, not negative
      expect(result.finalTotal).toBe(0);
    });

    it('should handle invalid coupon code gracefully', async () => {
      PricingRule.findByCode.mockResolvedValue(null);
      PricingRule.findApplicableRules.mockResolvedValue([]);

      const result = await PricingEngine.evaluateCart(sampleItems, ['INVALID']);

      expect(result.errors).toContain('Coupon code "INVALID" not found or expired');
      expect(result.discountTotal).toBe(0);
    });

    it('should validate coupon without applying it', async () => {
      const validCoupon: Partial<IPricingRule> = {
        _id: new Types.ObjectId(),
        name: 'Valid Coupon',
        type: 'coupon',
        code: 'VALID10',
        status: 'active',
        priority: 50,
        stackable: false,
        discount: { type: 'percentage', value: 10 },
        applicableTo: { type: 'all' },
        usageLimits: {
          currentUsageTotal: 0,
          minCartValue: 1000,
        },
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
        excludeDiscountedItems: false,
        excludeSaleItems: false,
        isVendorRule: false,
        description: 'Get 10% off your order',
        hasReachedUsageLimit: () => false,
      } as any;

      PricingRule.findByCode.mockResolvedValue(validCoupon);

      const validation = await PricingEngine.validateCoupon('VALID10', 5000);

      expect(validation.valid).toBe(true);
      expect(validation.message).toContain('Valid');
      expect(validation.rule).toBeDefined();
    });
  });
});
