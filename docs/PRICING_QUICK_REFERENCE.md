# Pricing Rules - Quick Reference

**Feature #181** | **Status**: ✅ Completed | **Tests**: 17/17 PASS

## 🚀 Quick Start

```typescript
import { PricingEngine } from './services/pricingEngine';
import { PricingRule } from './models/PricingRule';

// Evaluate cart with coupon
const result = await PricingEngine.evaluateCart(cartItems, ['SAVE10']);

// Display to user
console.log(PricingEngine.formatBreakdown(result));
```

## 📊 Core Concepts

### Rule Types

| Type | Description | Example |
|------|-------------|---------|
| `coupon` | Code-based discount | "SAVE10" gives 10% off |
| `promotion` | Auto-apply discount | All electronics 15% off |
| `tiered` | Bulk pricing | Buy 50+: ₹120/unit (was ₹150) |
| `bundle` | Product bundles | Buy X, get Y free (future) |

### Discount Types

| Type | Format | Example |
|------|--------|---------|
| `percentage` | `0-100` | `{ type: 'percentage', value: 15 }` → 15% off |
| `fixed` | Amount in ₹ | `{ type: 'fixed', value: 500 }` → ₹500 off |
| `tiered` | Quantity ranges | See [Tiered Pricing](#tiered-pricing) |

### Rule Status

| Status | Meaning | Auto-Transitions |
|--------|---------|------------------|
| `active` | Currently valid | → `expired` when `validUntil` passed |
| `inactive` | Manually disabled | None |
| `scheduled` | Waiting to start | → `active` when `validFrom` reached |
| `expired` | Past validity date | None |

## 🎯 Common Patterns

### Pattern 1: Simple Percentage Coupon

```typescript
const coupon = await PricingRule.create({
  name: 'Welcome Discount',
  type: 'coupon',
  code: 'WELCOME10',
  status: 'active',
  priority: 50,
  stackable: true,
  discount: { type: 'percentage', value: 10 },
  applicableTo: { type: 'all' },
  usageLimits: {
    currentUsageTotal: 0,
    maxUsageTotal: 1000,  // Max 1000 uses
    minCartValue: 500,     // Min ₹500 cart
  },
  validFrom: new Date(),
  validUntil: new Date('2025-12-31'),
  excludeDiscountedItems: false,
  excludeSaleItems: false,
  isVendorRule: false,
});
```

### Pattern 2: Category-Specific Promotion

```typescript
const promo = await PricingRule.create({
  name: 'Electronics Sale',
  type: 'promotion',
  status: 'active',
  priority: 40,
  stackable: true,
  discount: { type: 'percentage', value: 15 },
  applicableTo: {
    type: 'category',
    categoryIds: [electronicsId, gadgetsId],
  },
  usageLimits: { currentUsageTotal: 0 },
  validFrom: new Date(),
  validUntil: new Date('2025-06-30'),
  excludeDiscountedItems: true,  // Don't stack with sale items
  excludeSaleItems: false,
  isVendorRule: false,
});
```

### Pattern 3: Bulk Tiered Pricing

```typescript
const bulkDiscount = await PricingRule.create({
  name: 'Wholesale Pricing',
  type: 'tiered',
  status: 'active',
  priority: 60,
  stackable: false,  // Exclusive
  discount: {
    type: 'tiered',
    tiers: [
      { minQuantity: 10, maxQuantity: 24, discountPercentage: 10 },
      { minQuantity: 25, maxQuantity: 49, discountPercentage: 15 },
      { minQuantity: 50, discountPercentage: 20 },
    ],
  },
  applicableTo: { type: 'all' },
  usageLimits: { currentUsageTotal: 0 },
  validFrom: new Date(),
  validUntil: new Date('2025-12-31'),
  excludeDiscountedItems: false,
  excludeSaleItems: false,
  isVendorRule: false,
});
```

### Pattern 4: Non-Stackable Exclusive Coupon

```typescript
const exclusive = await PricingRule.create({
  name: 'Big Spender Reward',
  type: 'coupon',
  code: 'BIG5K',
  status: 'active',
  priority: 100,  // Highest priority
  stackable: false,  // Cannot combine!
  discount: { type: 'fixed', value: 5000 },
  applicableTo: { type: 'all' },
  usageLimits: {
    currentUsageTotal: 0,
    maxUsageTotal: 50,
    minCartValue: 50000,  // Min ₹50k cart
    maxDiscountAmount: 5000,
  },
  validFrom: new Date(),
  validUntil: new Date('2025-03-31'),
  excludeDiscountedItems: false,
  excludeSaleItems: false,
  isVendorRule: false,
});
```

### Pattern 5: Whitelist Stacking (Only Specific Rules)

```typescript
const rule1Id = new Types.ObjectId();
const rule2Id = new Types.ObjectId();

// Rule 1: Only stackable with Rule 2
const rule1 = await PricingRule.create({
  _id: rule1Id,
  name: 'Category Discount',
  type: 'promotion',
  status: 'active',
  priority: 50,
  stackable: true,
  stackableWith: [rule2Id],  // ONLY with Rule 2!
  discount: { type: 'percentage', value: 10 },
  applicableTo: { type: 'all' },
  usageLimits: { currentUsageTotal: 0 },
  validFrom: new Date(),
  validUntil: new Date('2025-12-31'),
  excludeDiscountedItems: false,
  excludeSaleItems: false,
  isVendorRule: false,
});

// Rule 2: Compatible
const rule2 = await PricingRule.create({
  _id: rule2Id,
  name: 'Brand Loyalty',
  type: 'promotion',
  status: 'active',
  priority: 40,
  stackable: true,
  stackableWith: [rule1Id],  // Mutual whitelist
  discount: { type: 'fixed', value: 300 },
  applicableTo: { type: 'all' },
  usageLimits: { currentUsageTotal: 0 },
  validFrom: new Date(),
  validUntil: new Date('2025-12-31'),
  excludeDiscountedItems: false,
  excludeSaleItems: false,
  isVendorRule: false,
});
```

## 🔍 Static Methods

### Find Coupon by Code

```typescript
const coupon = await PricingRule.findByCode('SAVE10');

if (!coupon) {
  throw new Error('Coupon not found or expired');
}

if (coupon.hasReachedUsageLimit()) {
  throw new Error('Coupon usage limit reached');
}
```

### Find Active Promotions

```typescript
const promos = await PricingRule.findActivePromotions();
// Returns: All active auto-apply rules sorted by priority DESC
```

### Find Applicable Rules for Cart

```typescript
const productIds = items.map(i => i.productId);
const categoryIds = items.map(i => i.categoryId).filter(Boolean);
const vendorIds = items.map(i => i.vendorId).filter(Boolean);

const rules = await PricingRule.findApplicableRules(
  productIds,
  categoryIds,
  vendorIds
);
// Returns: Active rules matching any product/category/vendor in cart
```

## 💰 Pricing Engine API

### Evaluate Cart

```typescript
const result = await PricingEngine.evaluateCart(
  items,              // CartItem[]
  ['SAVE10', 'VIP'],  // Coupon codes (optional)
  userId              // User ID (optional, for per-user limits)
);

// Result structure:
{
  originalTotal: 21000,
  discountTotal: 2600,
  finalTotal: 18400,
  appliedDiscounts: [
    {
      ruleId: ObjectId,
      ruleName: 'Platform Sale',
      ruleType: 'promotion',
      code: undefined,
      discountAmount: 2100,
      appliedTo: 'cart',
      explanation: 'Platform Sale: 10% off (-₹2100)'
    },
    {
      ruleId: ObjectId,
      ruleName: 'Welcome Coupon',
      ruleType: 'coupon',
      code: 'SAVE10',
      discountAmount: 500,
      appliedTo: 'cart',
      explanation: 'Applied Coupon SAVE10 (-₹500)'
    }
  ],
  errors: [],
  warnings: []
}
```

### Validate Coupon (Without Applying)

```typescript
const validation = await PricingEngine.validateCoupon(
  'SAVE10',
  cartTotal,
  userId
);

if (!validation.valid) {
  console.error(validation.message);
  // "Minimum cart value of ₹10,000 required"
} else {
  console.log(validation.message);
  // "Valid: Get 10% off your order"
  console.log(validation.rule);  // Full rule object
}
```

### Format Breakdown for UI

```typescript
const lines = PricingEngine.formatBreakdown(result);

console.log(lines.join('\n'));
// Output:
// Subtotal: ₹21,000.00
// 
// Discounts:
//   Platform Sale: 10% off (-₹2,100)
//   Applied Coupon SAVE10 (-₹500)
// 
// Total Savings: -₹2,600.00
// 
// Total: ₹18,400.00
```

## 🎨 CartItem Interface

```typescript
interface CartItem {
  productId: ObjectId;
  sku: string;
  name: string;
  categoryId?: ObjectId;
  vendorId?: ObjectId;
  quantity: number;
  unitPrice: number;
  originalTotal: number;  // quantity * unitPrice
  isDiscounted?: boolean;  // Already on sale?
  isSaleItem?: boolean;    // Part of clearance?
}
```

## ⚙️ Stacking Rules Decision Tree

```
1. Is there a non-stackable rule already applied?
   YES → Block all further rules
   NO → Continue to step 2

2. Is current rule stackable?
   NO → Apply only if no rules applied yet
   YES → Continue to step 3

3. Does current rule have stackableWith whitelist?
   NO → Can stack with any stackable rule
   YES → Continue to step 4

4. Are all applied rules in the whitelist?
   NO → Reject rule
   YES → Continue to step 5

5. Do all applied rules allow this rule in THEIR whitelists?
   NO → Reject rule
   YES → Apply rule
```

## 🚨 Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Coupon code X not found or expired" | Invalid code or past validUntil | Check code spelling, check date range |
| "Coupon code X has reached usage limit" | maxUsageTotal exceeded | Increase limit or create new coupon |
| "Coupon X requires minimum cart value of ₹Y" | Cart total < minCartValue | Add more items or reduce min requirement |
| "Rule X cannot be stacked with other discounts" | Non-stackable rule conflict | Remove conflicting rule or change stackable flag |
| "Rule X can only stack with specific rules" | Not in stackableWith whitelist | Add rule ID to whitelist or remove restriction |

## 📈 Performance Tips

### Tip 1: Index Usage

```typescript
// GOOD: Uses index on { code, status }
await PricingRule.findByCode('SAVE10');

// GOOD: Uses index on { type, status }
await PricingRule.findActivePromotions();

// GOOD: Uses index on { validFrom, validUntil }
await PricingRule.find({ validFrom: { $lte: now }, validUntil: { $gte: now } });
```

### Tip 2: Cache Active Promotions

```typescript
// Cache for 5 minutes (auto-apply rules change rarely)
const cachedPromos = await cache.get('active_promotions');
if (!cachedPromos) {
  const promos = await PricingRule.findActivePromotions();
  await cache.set('active_promotions', promos, 300);  // 5 min TTL
  return promos;
}
return cachedPromos;
```

### Tip 3: Batch Coupon Validation

```typescript
// GOOD: Validate all coupons in parallel
const validations = await Promise.all(
  couponCodes.map(code => PricingEngine.validateCoupon(code, cartTotal))
);

// BAD: Sequential validation
for (const code of couponCodes) {
  await PricingEngine.validateCoupon(code, cartTotal);  // Slower
}
```

## 🧪 Testing Helpers

### Create Test Rule

```typescript
const createTestRule = (overrides = {}) => ({
  name: 'Test Rule',
  type: 'promotion',
  status: 'active',
  priority: 50,
  stackable: true,
  discount: { type: 'percentage', value: 10 },
  applicableTo: { type: 'all' },
  usageLimits: { currentUsageTotal: 0 },
  validFrom: new Date(),
  validUntil: new Date('2099-12-31'),
  excludeDiscountedItems: false,
  excludeSaleItems: false,
  isVendorRule: false,
  ...overrides,
});

const rule = await PricingRule.create(createTestRule({
  name: 'Custom Test',
  discount: { type: 'fixed', value: 500 },
}));
```

### Mock Cart Items

```typescript
const mockCartItems = (count = 2) => Array.from({ length: count }, (_, i) => ({
  productId: new Types.ObjectId(),
  sku: `PROD-${i + 1}`,
  name: `Product ${i + 1}`,
  categoryId: new Types.ObjectId(),
  vendorId: new Types.ObjectId(),
  quantity: 1,
  unitPrice: 1000,
  originalTotal: 1000,
}));

const items = mockCartItems(5);  // 5 items, ₹5,000 total
```

## 📚 Related Documentation

- **Full Implementation**: `docs/FEATURE_181_SUMMARY.md`
- **Test Suite**: `apps/api/tests/pricingEngine.spec.ts`
- **Model**: `apps/api/src/models/PricingRule.ts`
- **Engine**: `apps/api/src/services/pricingEngine.ts`

## 🔗 Integration Examples

### Express Route

```typescript
import { PricingEngine } from '../services/pricingEngine';

router.post('/cart/calculate', async (req, res) => {
  try {
    const { items, couponCodes } = req.body;
    const userId = req.user?.id;
    
    const result = await PricingEngine.evaluateCart(items, couponCodes, userId);
    
    if (result.errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: result.errors,
      });
    }
    
    res.json({
      success: true,
      data: {
        originalTotal: result.originalTotal,
        finalTotal: result.finalTotal,
        savings: result.discountTotal,
        appliedDiscounts: result.appliedDiscounts,
        breakdown: PricingEngine.formatBreakdown(result),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### React Component

```typescript
import { useState } from 'react';

function CartSummary({ items }) {
  const [result, setResult] = useState(null);
  const [coupon, setCoupon] = useState('');
  
  const applyPricing = async () => {
    const response = await fetch('/api/cart/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, couponCodes: coupon ? [coupon] : [] }),
    });
    
    const data = await response.json();
    if (data.success) {
      setResult(data.data);
    }
  };
  
  return (
    <div>
      <input
        value={coupon}
        onChange={e => setCoupon(e.target.value.toUpperCase())}
        placeholder="Coupon code"
      />
      <button onClick={applyPricing}>Apply</button>
      
      {result && (
        <div>
          <p>Subtotal: ₹{result.originalTotal.toFixed(2)}</p>
          {result.appliedDiscounts.map((d, i) => (
            <p key={i} className="text-green-600">{d.explanation}</p>
          ))}
          <p className="font-bold">Total: ₹{result.finalTotal.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
```

---

**Last Updated**: January 20, 2025  
**Version**: 1.0.0  
**Feature Status**: ✅ Production-Ready
