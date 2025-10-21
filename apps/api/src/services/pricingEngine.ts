/**
 * Feature #181: Pricing Engine Service
 * 
 * Evaluates applicable pricing rules for carts and orders.
 * Handles:
 * - Coupon code validation and application
 * - Automatic promotion detection
 * - Tiered pricing for bulk purchases
 * - Rule stacking and conflict resolution
 * - Discount breakdowns for UI display
 */

import { Types } from 'mongoose';
import { PricingRule, IPricingRule } from '../models/PricingRule';

export interface CartItem {
  productId: Types.ObjectId;
  sku: string;
  name: string;
  categoryId?: Types.ObjectId;
  vendorId?: Types.ObjectId;
  quantity: number;
  unitPrice: number;           // Original price per unit
  originalTotal: number;       // quantity * unitPrice
  isDiscounted?: boolean;      // Already on sale?
  isSaleItem?: boolean;        // Part of clearance/sale?
}

export interface AppliedDiscount {
  ruleId: Types.ObjectId;
  ruleName: string;
  ruleType: 'coupon' | 'promotion' | 'tiered' | 'bundle';
  code?: string;               // If coupon
  discountAmount: number;      // Amount saved
  appliedTo: 'cart' | 'item';  // Cart-level or item-level
  itemId?: string;             // If item-level, which item (productId or index)
  explanation: string;         // Human-readable explanation
}

export interface PricingResult {
  originalTotal: number;
  discountTotal: number;
  finalTotal: number;
  appliedDiscounts: AppliedDiscount[];
  errors: string[];            // Validation errors (e.g., "Coupon expired")
  warnings: string[];          // Non-blocking warnings (e.g., "Coupon not stackable")
}

export class PricingEngine {
  /**
   * Evaluate pricing for a cart with optional coupon codes
   */
  static async evaluateCart(
    items: CartItem[],
    couponCodes: string[] = [],
    _userId?: Types.ObjectId
  ): Promise<PricingResult> {
    const result: PricingResult = {
      originalTotal: 0,
      discountTotal: 0,
      finalTotal: 0,
      appliedDiscounts: [],
      errors: [],
      warnings: [],
    };

    // Calculate original total
    result.originalTotal = items.reduce((sum, item) => sum + item.originalTotal, 0);

    // Step 1: Validate and load coupon rules
    const couponRules: IPricingRule[] = [];
    for (const code of couponCodes) {
      const rule = await PricingRule.findByCode(code);
      
      if (!rule) {
        result.errors.push(`Coupon code "${code}" not found or expired`);
        continue;
      }

      if (rule.hasReachedUsageLimit()) {
        result.errors.push(`Coupon code "${code}" has reached usage limit`);
        continue;
      }

      // Check min cart value
      if (rule.usageLimits.minCartValue && result.originalTotal < rule.usageLimits.minCartValue) {
        result.errors.push(
          `Coupon "${code}" requires minimum cart value of ₹${rule.usageLimits.minCartValue}`
        );
        continue;
      }

      // TODO: Check per-user usage limit (requires user purchase history)
      
      couponRules.push(rule);
    }

    // Step 2: Load applicable automatic promotions
    const productIds = items.map((item) => item.productId);
    const categoryIds = items
      .filter((item) => item.categoryId)
      .map((item) => item.categoryId!);
    const vendorIds = items
      .filter((item) => item.vendorId)
      .map((item) => item.vendorId!);

    const promotionRules = await PricingRule.findApplicableRules(
      productIds,
      categoryIds,
      vendorIds
    );

    // Step 3: Combine all rules and sort by priority
    const allRules = [...couponRules, ...promotionRules].sort((a, b) => b.priority - a.priority);

    // Step 4: Apply rules with stacking logic
    const appliedRuleIds = new Set<string>();
    let hasNonStackableRule = false; // Track if any non-stackable rule has been applied
    
    for (const rule of allRules) {
      // If a non-stackable rule was already applied, skip all others
      if (hasNonStackableRule) {
        result.warnings.push(`Rule "${rule.name}" cannot be stacked with other discounts`);
        continue;
      }

      // Check stacking constraints
      if (appliedRuleIds.size > 0 && !rule.stackable) {
        result.warnings.push(`Rule "${rule.name}" cannot be stacked with other discounts`);
        continue;
      }

      // Check stackableWith whitelist (if specified, rule can ONLY stack with those specific rules)
      if (appliedRuleIds.size > 0 && rule.stackableWith && rule.stackableWith.length > 0) {
        const appliedIds = Array.from(appliedRuleIds);
        // All already-applied rules must be in the whitelist
        const canStack = appliedIds.every((id) =>
          rule.stackableWith!.some((allowed: Types.ObjectId) => allowed.toString() === id)
        );
        
        if (!canStack) {
          result.warnings.push(`Rule "${rule.name}" can only stack with specific rules`);
          continue;
        }
      }
      
      // Also check if already-applied rules allow this new rule to be stacked
      if (appliedRuleIds.size > 0) {
        // Check each applied rule to see if it has a whitelist that excludes this rule
        const ruleId = rule._id.toString();
        let blockedByAppliedRule = false;
        
        for (const appliedId of appliedRuleIds) {
          const appliedRule = allRules.find(r => r._id.toString() === appliedId);
          if (appliedRule && appliedRule.stackableWith && appliedRule.stackableWith.length > 0) {
            // Applied rule has whitelist - check if current rule is in it
            const isInWhitelist = appliedRule.stackableWith.some((allowed: Types.ObjectId) => 
              allowed.toString() === ruleId
            );
            if (!isInWhitelist) {
              blockedByAppliedRule = true;
              break;
            }
          }
        }
        
        if (blockedByAppliedRule) {
          result.warnings.push(`Rule "${rule.name}" can only stack with specific rules`);
          continue;
        }
      }

      // Apply the rule
      const discount = await this.applyRule(rule, items, result.originalTotal);
      
      if (discount) {
        result.appliedDiscounts.push(discount);
        result.discountTotal += discount.discountAmount;
        appliedRuleIds.add(rule._id.toString());
        
        // Mark if this is a non-stackable rule (block further rules)
        if (!rule.stackable) {
          hasNonStackableRule = true;
        }
        
        // Cap discount at maxDiscountAmount if set
        if (rule.usageLimits.maxDiscountAmount && discount.discountAmount > rule.usageLimits.maxDiscountAmount) {
          const cappedAmount = rule.usageLimits.maxDiscountAmount;
          const originalAmount = discount.discountAmount;
          discount.discountAmount = cappedAmount;
          result.discountTotal = result.discountTotal - originalAmount + cappedAmount;
          result.warnings.push(
            `Discount capped at ₹${cappedAmount} (max allowed for this rule)`
          );
        }
      }
    }

    // Step 5: Calculate final total (never below 0)
    result.finalTotal = Math.max(0, result.originalTotal - result.discountTotal);

    return result;
  }

  /**
   * Apply a single pricing rule to cart items
   */
  private static async applyRule(
    rule: IPricingRule,
    items: CartItem[],
    cartTotal: number
  ): Promise<AppliedDiscount | null> {
    // Filter applicable items
    const applicableItems = items.filter((item) => this.isItemApplicable(item, rule));

    if (applicableItems.length === 0) {
      return null; // Rule doesn't apply to any items
    }

    // Calculate discount based on type
    switch (rule.discount.type) {
      case 'percentage':
        return this.applyPercentageDiscount(rule, applicableItems, cartTotal);
      
      case 'fixed':
        return this.applyFixedDiscount(rule, applicableItems, cartTotal);
      
      case 'tiered':
        return this.applyTieredDiscount(rule, applicableItems);
      
      default:
        return null;
    }
  }

  /**
   * Check if an item qualifies for a rule
   */
  private static isItemApplicable(item: CartItem, rule: IPricingRule): boolean {
    // Exclude already-discounted items if rule says so
    if (rule.excludeDiscountedItems && item.isDiscounted) {
      return false;
    }

    // Exclude sale items if rule says so
    if (rule.excludeSaleItems && item.isSaleItem) {
      return false;
    }

    // Check applicability
    const applicableTo = rule.applicableTo;

    if (applicableTo.type === 'all') {
      return true;
    }

    if (applicableTo.type === 'product') {
      return applicableTo.productIds?.some((id) => id.equals(item.productId)) || false;
    }

    if (applicableTo.type === 'category') {
      return (
        item.categoryId &&
        applicableTo.categoryIds?.some((id) => id.equals(item.categoryId!)) ||
        false
      );
    }

    if (applicableTo.type === 'vendor') {
      return (
        item.vendorId &&
        applicableTo.vendorIds?.some((id) => id.equals(item.vendorId!)) ||
        false
      );
    }

    return false;
  }

  /**
   * Apply percentage discount
   */
  private static applyPercentageDiscount(
    rule: IPricingRule,
    items: CartItem[],
    _cartTotal: number
  ): AppliedDiscount {
    const applicableTotal = items.reduce((sum, item) => sum + item.originalTotal, 0);
    const discountAmount = (applicableTotal * rule.discount.value!) / 100;

    let explanation: string;
    if (rule.type === 'coupon') {
      explanation = `Applied Coupon ${rule.code}: ${rule.discount.value}% off`;
    } else {
      explanation = `${rule.name}: ${rule.discount.value}% off`;
    }

    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.type,
      code: rule.code,
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimals
      appliedTo: 'cart',
      explanation: `${explanation} (-₹${Math.round(discountAmount)})`,
    };
  }

  /**
   * Apply fixed amount discount
   */
  private static applyFixedDiscount(
    rule: IPricingRule,
    _items: CartItem[],
    _cartTotal: number
  ): AppliedDiscount {
    const discountAmount = rule.discount.value!;

    let explanation: string;
    if (rule.type === 'coupon') {
      explanation = `Applied Coupon ${rule.code}`;
    } else {
      explanation = `${rule.name}`;
    }

    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.type,
      code: rule.code,
      discountAmount,
      appliedTo: 'cart',
      explanation: `${explanation} (-₹${discountAmount})`,
    };
  }

  /**
   * Apply tiered pricing (bulk discounts)
   */
  private static applyTieredDiscount(
    rule: IPricingRule,
    items: CartItem[]
  ): AppliedDiscount | null {
    if (!rule.discount.tiers || rule.discount.tiers.length === 0) {
      return null;
    }

    let totalDiscount = 0;
    const explanationParts: string[] = [];

    for (const item of items) {
      // Find applicable tier for this item's quantity
      const tier = rule.discount.tiers.find(
        (t) =>
          item.quantity >= t.minQuantity &&
          (!t.maxQuantity || item.quantity <= t.maxQuantity)
      );

      if (!tier) {
        continue; // No tier applies
      }

      let itemDiscount = 0;

      if (tier.pricePerUnit) {
        // Override price per unit
        const newTotal = tier.pricePerUnit * item.quantity;
        itemDiscount = item.originalTotal - newTotal;
        explanationParts.push(
          `${item.name} (${item.quantity} units): ₹${tier.pricePerUnit}/unit`
        );
      } else if (tier.discountPercentage) {
        itemDiscount = (item.originalTotal * tier.discountPercentage) / 100;
        explanationParts.push(
          `${tier.discountPercentage}% off for ${item.quantity}+ units`
        );
      } else if (tier.discountFixed) {
        itemDiscount = tier.discountFixed;
        explanationParts.push(
          `${item.name}: ₹${tier.discountFixed} off for ${item.quantity}+ units`
        );
      }

      totalDiscount += itemDiscount;
    }

    if (totalDiscount === 0) {
      return null;
    }

    // Use the most relevant explanation (percentage if exists)
    let mainExplanation = explanationParts.length > 0 ? explanationParts[0] : `${rule.name}: Bulk discount`;

    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.type,
      code: rule.code,
      discountAmount: Math.round(totalDiscount * 100) / 100,
      appliedTo: 'cart',
      explanation: `${mainExplanation} (-₹${Math.round(totalDiscount)})`,
    };
  }

  /**
   * Get detailed breakdown for UI display
   */
  static formatBreakdown(result: PricingResult): string[] {
    const lines: string[] = [];
    
    lines.push(`Subtotal: ₹${result.originalTotal.toFixed(2)}`);
    
    if (result.appliedDiscounts.length > 0) {
      lines.push('\nDiscounts:');
      for (const discount of result.appliedDiscounts) {
        lines.push(`  ${discount.explanation}`);
      }
      lines.push(`\nTotal Savings: -₹${result.discountTotal.toFixed(2)}`);
    }
    
    lines.push(`\nTotal: ₹${result.finalTotal.toFixed(2)}`);
    
    if (result.warnings.length > 0) {
      lines.push('\nNotes:');
      result.warnings.forEach((warning) => lines.push(`  - ${warning}`));
    }
    
    return lines;
  }

  /**
   * Validate a coupon code without applying it
   */
  static async validateCoupon(
    code: string,
    cartTotal: number,
    _userId?: Types.ObjectId
  ): Promise<{ valid: boolean; message: string; rule?: IPricingRule }> {
    const rule = await PricingRule.findByCode(code);

    if (!rule) {
      return { valid: false, message: 'Coupon code not found or expired' };
    }

    if (rule.hasReachedUsageLimit()) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }

    if (rule.usageLimits.minCartValue && cartTotal < rule.usageLimits.minCartValue) {
      return {
        valid: false,
        message: `Minimum cart value of ₹${rule.usageLimits.minCartValue} required`,
      };
    }

    // TODO: Check per-user usage limit

    return {
      valid: true,
      message: `Valid: ${rule.description || rule.name}`,
      rule,
    };
  }
}
