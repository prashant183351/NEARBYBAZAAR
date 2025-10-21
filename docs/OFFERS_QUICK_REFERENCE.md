# ProductOffer - Quick Reference

**Feature #182** | **Status**: ✅ Completed | **Tests**: 36/36 PASS

## 🚀 Quick Start

```typescript
import { ProductOffer } from './models/ProductOffer';

// Create offer
const offer = await ProductOffer.create({
  productId: '507f1f77bcf86cd799439011',
  vendorId: req.user.vendorId,
  price: 999,
  stock: 100,
  shippingTerms: {
    sla: 2,
    shippingCharge: 50,
    handlingTime: 1,
  },
  fulfillmentMethod: 'FBM',
  condition: 'new',
});

// Get "More Buying Options"
const offers = await ProductOffer.findActiveOffers(productId);
```

## 📊 Core Concepts

### Offer States

| Field | Type | Description |
|-------|------|-------------|
| `isActive` | boolean | Visible to buyers |
| `isPaused` | boolean | Temporarily unavailable (auto-managed) |
| `stock` | number | Available quantity |

**Visibility Rules**:
- Public sees: `isActive && !isPaused && stock > 0`
- Vendor sees: All their offers
- Admin sees: All offers

### Fulfillment Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| `FBM` | Fulfilled By Merchant | Vendor ships directly |
| `FBA` | Fulfilled By Amazon | Platform handles shipping |
| `dropship` | Dropshipping | Supplier ships directly |

### Product Conditions

| Condition | Description |
|-----------|-------------|
| `new` | Brand new, unused |
| `refurbished` | Professionally restored |
| `used-like-new` | Minimal wear, perfect condition |
| `used-good` | Some wear, fully functional |
| `used-acceptable` | Heavy wear, fully functional |

## 🎯 Common Patterns

### Pattern 1: Create Offer with Savings Display

```typescript
const offer = await ProductOffer.create({
  productId: productId,
  vendorId: vendorId,
  price: 799,
  compareAtPrice: 999,  // Show "Save 20%"
  stock: 50,
  lowStockThreshold: 5,
  shippingTerms: {
    sla: 2,
    shippingCharge: 49,
    handlingTime: 1,
    freeShippingThreshold: 500,  // Free if cart > ₹500
  },
  fulfillmentMethod: 'FBM',
  condition: 'new',
});

console.log(`Savings: ₹${offer.savings} (${offer.savingsPercent}%)`);
// Output: Savings: ₹200 (20%)
```

### Pattern 2: Display "More Buying Options"

```typescript
// Get all active offers sorted by price
const offers = await ProductOffer.findActiveOffers(productId);

// Render in UI
offers.forEach(offer => {
  console.log(`
    ${offer.vendorId.name}
    ₹${offer.price} ${offer.savings > 0 ? `(Save ${offer.savingsPercent}%)` : ''}
    Condition: ${offer.condition}
    Delivery: ${offer.totalDeliveryTime} days
    Rating: ${offer.sellerRating}/5.0
  `);
});
```

### Pattern 3: Atomic Stock Update

```typescript
// Reserve stock for order (atomic, prevents race conditions)
try {
  await offer.updateStock(-5);  // Subtract 5 units
  console.log(`Reserved 5 units. ${offer.stock} remaining.`);
} catch (error) {
  console.error('Insufficient stock!');
  // Stock would go negative, update rejected
}

// Replenish stock
await offer.updateStock(50);  // Add 50 units
```

### Pattern 4: Low Stock Alerts

```typescript
// Get vendor's low stock offers
const lowStockOffers = await ProductOffer.find({
  vendorId: req.user.vendorId,
  isActive: true,
  $expr: { $lte: ['$stock', '$lowStockThreshold'] },
  stock: { $gt: 0 },  // Exclude out-of-stock
})
  .populate('productId', 'name sku')
  .sort({ stock: 1 });

lowStockOffers.forEach(offer => {
  console.log(`⚠️ ${offer.productId.name}: Only ${offer.stock} left!`);
});
```

### Pattern 5: Check Availability & Fulfillment

```typescript
// Check if offer can fulfill order
if (offer.isAvailable()) {
  if (offer.canFulfill(requestedQuantity)) {
    // Process order
    await offer.updateStock(-requestedQuantity);
  } else {
    throw new Error(`Only ${offer.stock} units available`);
  }
} else {
  // Offer is inactive, paused, or out of stock
  throw new Error('Offer not available');
}
```

## 🔍 Static Methods

### Find Offers by Product

```typescript
// Get all offers for a product (any status)
const allOffers = await ProductOffer.findByProduct(productId);

// Get only active offers (for public display)
const activeOffers = await ProductOffer.findActiveOffers(productId);
// Returns: Active, unpaused offers with stock > 0, sorted by price ASC
```

### Find Vendor's Offers

```typescript
// Get all offers by a vendor
const myOffers = await ProductOffer.findByVendor(vendorId);
// Includes inactive/paused offers (vendor sees all)
```

### Find Specific Vendor's Offer

```typescript
// Check if vendor already has offer for this product
const existing = await ProductOffer.findVendorOffer(productId, vendorId);

if (existing) {
  // Update existing offer
  existing.price = newPrice;
  await existing.save();
} else {
  // Create new offer
  await ProductOffer.create({ ... });
}
```

## 💰 Instance Methods

### Check Availability

```typescript
offer.isAvailable()
// Returns: true if isActive && !isPaused && stock > 0
```

### Check Low Stock

```typescript
offer.hasLowStock()
// Returns: true if stock <= lowStockThreshold && stock > 0
```

### Update Stock Atomically

```typescript
await offer.updateStock(quantity)
// quantity > 0: Add stock
// quantity < 0: Subtract stock (fails if would go negative)
// Updates: this.stock, this.lastStockUpdate
// Throws: 'Insufficient stock or offer not found' if rejected
```

### Check Fulfillment Capacity

```typescript
offer.canFulfill(requestedQuantity)
// Returns: true if available AND has enough stock
```

## 🎨 Virtual Properties

```typescript
// Savings amount
offer.savings
// Returns: compareAtPrice - price (or 0 if no compareAtPrice)

// Savings percentage
offer.savingsPercent
// Returns: Math.round(((compareAtPrice - price) / compareAtPrice) * 100)

// Total delivery time
offer.totalDeliveryTime
// Returns: handlingTime + sla
```

## ⚙️ API Routes

### Public Routes

```http
GET /api/offers/product/:productId
# Returns: Active offers for product (sorted by price)

GET /api/offers/:id
# Returns: Single offer (inactive only visible to owner)
```

### Vendor Routes

```http
POST /api/offers
Body: { productId, price, stock, shippingTerms, ... }
# Creates: New offer (enforces uniqueness)

GET /api/offers/my-offers
# Returns: All vendor's offers

GET /api/offers/low-stock
# Returns: Offers where stock <= lowStockThreshold

PUT /api/offers/:id
Body: { price?, stock?, ... }
# Updates: Offer (partial update supported)

PATCH /api/offers/:id/stock
Body: { quantity: number }
# Updates: Stock atomically (+/- quantity)

PATCH /api/offers/:id/pause
# Toggles: isPaused flag

DELETE /api/offers/:id
# Soft deletes: Sets isActive = false
```

## 📈 Performance Tips

### Tip 1: Use Indexes

```typescript
// GOOD: Uses unique_product_vendor_offer index
await ProductOffer.findVendorOffer(productId, vendorId);

// GOOD: Uses active_offers_by_product index
await ProductOffer.findActiveOffers(productId);

// GOOD: Uses vendor_active_offers index
await ProductOffer.findByVendor(vendorId);
```

### Tip 2: Populate Selectively

```typescript
// GOOD: Only populate needed fields
await ProductOffer.findByProduct(productId)
  .populate('vendorId', 'name slug logo rating');

// BAD: Populate entire vendor document
await ProductOffer.findByProduct(productId)
  .populate('vendorId');  // Fetches all vendor fields
```

### Tip 3: Cache Active Offers

```typescript
// Cache for 5 minutes (offers change rarely)
const cacheKey = `offers:${productId}`;
const cached = await cache.get(cacheKey);

if (!cached) {
  const offers = await ProductOffer.findActiveOffers(productId);
  await cache.set(cacheKey, offers, 300);  // 5 min TTL
  return offers;
}
return cached;
```

## 🚨 Error Handling

### Duplicate Offer Error

```typescript
try {
  await ProductOffer.create({ productId, vendorId, ... });
} catch (error) {
  if (error.code === 11000) {
    // Unique constraint violation
    console.error('You already have an offer for this product');
    // Solution: Update existing offer instead
  }
}
```

### Insufficient Stock Error

```typescript
try {
  await offer.updateStock(-10);
} catch (error) {
  if (error.message === 'Insufficient stock or offer not found') {
    console.error(`Only ${offer.stock} units available`);
    // Solution: Reduce requested quantity or notify user
  }
}
```

### Validation Errors

```typescript
try {
  await offer.save();
} catch (error) {
  if (error.name === 'ValidationError') {
    // Extract all validation errors
    const errors = Object.values(error.errors).map(e => e.message);
    console.error('Validation failed:', errors);
    // Example: ['Price must be greater than zero', 'SLA cannot exceed 30 days']
  }
}
```

## 🧪 Testing Helpers

### Create Test Offer

```typescript
const createTestOffer = (overrides = {}) => ({
  productId: new Types.ObjectId(),
  vendorId: new Types.ObjectId(),
  price: 1000,
  stock: 50,
  lowStockThreshold: 5,
  shippingTerms: {
    sla: 2,
    shippingCharge: 50,
    handlingTime: 1,
  },
  fulfillmentMethod: 'FBM',
  condition: 'new',
  isActive: true,
  isPaused: false,
  ...overrides,
});

const offer = await ProductOffer.create(createTestOffer({
  price: 899,
  condition: 'refurbished',
}));
```

### Mock Multiple Offers

```typescript
const mockOffers = (productId, count = 3) => 
  Array.from({ length: count }, (_, i) => ({
    productId,
    vendorId: new Types.ObjectId(),
    price: 1000 - (i * 50),  // Decreasing prices
    stock: 10 + (i * 5),
    shippingTerms: {
      sla: 2 + i,  // Varying delivery times
      shippingCharge: 50,
      handlingTime: 1,
    },
    fulfillmentMethod: 'FBM',
    condition: 'new',
    isActive: true,
    isPaused: false,
  }));

const offers = await ProductOffer.create(mockOffers(productId, 5));
```

## 🔗 Integration Examples

### Express Route

```typescript
import { ProductOffer } from '../models/ProductOffer';

router.post('/offers', async (req, res) => {
  try {
    const { productId, price, stock, shippingTerms } = req.body;
    const vendorId = req.user.vendorId;
    
    // Check for existing offer
    const existing = await ProductOffer.findVendorOffer(productId, vendorId);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'You already have an offer for this product',
        offerId: existing._id,
      });
    }
    
    // Create offer
    const offer = await ProductOffer.create({
      productId,
      vendorId,
      price,
      stock,
      shippingTerms,
      fulfillmentMethod: 'FBM',
      condition: 'new',
    });
    
    res.status(201).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### React Component

```tsx
import { useState, useEffect } from 'react';

function BuyingOptions({ productId }) {
  const [offers, setOffers] = useState([]);
  
  useEffect(() => {
    fetch(`/api/offers/product/${productId}`)
      .then(res => res.json())
      .then(data => setOffers(data.data));
  }, [productId]);
  
  return (
    <div className="buying-options">
      <h3>More Buying Options</h3>
      {offers.map(offer => (
        <div key={offer._id} className="offer-card">
          <div className="vendor-name">{offer.vendorId.name}</div>
          <div className="price">
            ₹{offer.price}
            {offer.savings > 0 && (
              <span className="badge">Save {offer.savingsPercent}%</span>
            )}
          </div>
          <div className="condition">{offer.condition}</div>
          <div className="delivery">
            Delivers in {offer.totalDeliveryTime} days
          </div>
          <div className="rating">
            ⭐ {offer.sellerRating}/5.0
          </div>
          <button onClick={() => addToCart(offer._id, productId)}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 📚 Related Documentation

- **Full Implementation**: `docs/FEATURE_182_SUMMARY.md`
- **Test Suite**: `apps/api/tests/offers.spec.ts`
- **Model**: `apps/api/src/models/ProductOffer.ts`
- **Controller**: `apps/api/src/controllers/offers.ts`
- **Routes**: `apps/api/src/routes/offers.ts`

## 🔮 Next Steps

- **Feature #183**: Buy Box Service (determine which offer wins "default" button)
- **Feature #184**: Vendor KYC & Payouts (track sales per offer)
- **Feature #185**: Reviews Moderation (offer-specific reviews)
- **Feature #186**: Dispute Management (handle offer-level disputes)

---

**Last Updated**: October 20, 2025  
**Version**: 1.0.0  
**Feature Status**: ✅ Production-Ready
