# Checkout Models Quick Reference

## Model Summary

| Model | Purpose | ID Type | TTL | Key Features |
|-------|---------|---------|-----|--------------|
| **Address** | User addresses | ObjectId | No | Validation, default flag, GPS coords |
| **Cart** | Shopping cart | ObjectId | 7 days | Guest support, auto-totals, TTL |
| **Shipment** | Order tracking | ULID | No | Multi-package, event timeline |
| **PaymentIntent** | Payment processing | ULID | 15 min | Multi-gateway, refunds, capture |
| **StockReservation** | Inventory hold | ULID | 15 min | TTL auto-expire, extend, confirm |

## Quick Actions

### Address
```typescript
// Create address
const addr = await Address.create({
  userId, type: AddressType.SHIPPING,
  fullName: 'John Doe', phone: '9876543210',
  addressLine1: '123 Main St',
  city: 'Mumbai', state: 'Maharashtra',
  pincode: '400001', country: 'IN'
});

// Get full address string
console.log(addr.fullAddress);

// Check serviceability
await addr.isServiceable();
```

### Cart
```typescript
// Get or create cart
const cart = await Cart.findOrCreate(userId, sessionId);

// Add item
await cart.addItem({
  itemId: productId,
  itemType: 'product',
  quantity: 2,
  price: 999,
  tax: 179.82
});

// Update quantity
await cart.updateItemQuantity(itemId, 5);

// Remove item
await cart.removeItem(itemId);

// Clear cart
await cart.clear();

// Check totals
console.log(cart.total, cart.itemCount);
```

### Shipment
```typescript
// Create shipment
const shipment = await Shipment.create({
  orderId, vendorId, userId,
  carrier: 'Delhivery',
  shippingMethod: 'Standard',
  shippingCost: 50,
  shippingAddress: { /* address object */ }
});

// Add tracking event
await shipment.addTrackingEvent({
  status: ShipmentStatus.IN_TRANSIT,
  location: 'Mumbai Hub',
  description: 'In transit'
});

// Update status
await shipment.updateStatus(
  ShipmentStatus.DELIVERED,
  'Package delivered'
);

// Check status
console.log(shipment.isDelivered, shipment.isInTransit);
```

### PaymentIntent
```typescript
// Create payment intent
const payment = await PaymentIntent.create({
  orderId, userId,
  amount: 1000,
  currency: 'INR',
  gateway: PaymentGateway.PHONEPE
});

// Check capabilities
if (payment.canCapture()) {
  await payment.capture();
}

// Refund
if (payment.canRefund()) {
  await payment.refund(500, 'Customer request');
}

// Cancel
await payment.cancel();

// Check status
console.log(payment.isExpired, payment.availableRefundAmount);
```

### StockReservation
```typescript
// Reserve stock
const reservation = await StockReservation.reserveStock(
  productId,
  quantity,
  userId,
  {
    variantId: 'size-M',
    cartId: cart._id,
    expiryMinutes: 15
  }
);

// Confirm reservation
await reservation.confirm(orderId);

// Release reservation
await reservation.release();

// Extend expiry
await reservation.extend(10); // 10 more minutes

// Check status
console.log(reservation.isActive, reservation.timeRemaining);

// Get active reservations for product
const count = await StockReservation.getActiveReservations(
  productId,
  variantId
);
```

## Status Enums

### AddressType
```typescript
enum AddressType {
  HOME = 'home',
  WORK = 'work',
  BILLING = 'billing',
  SHIPPING = 'shipping',
  OTHER = 'other'
}
```

### ShipmentStatus
```typescript
enum ShipmentStatus {
  PENDING = 'pending',
  LABEL_CREATED = 'label_created',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
  CANCELLED = 'cancelled'
}
```

### PaymentStatus
```typescript
enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  REQUIRES_ACTION = 'requires_action',
  REQUIRES_CAPTURE = 'requires_capture',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}
```

### PaymentGateway
```typescript
enum PaymentGateway {
  PHONEPE = 'phonepe',
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
  COD = 'cod',
  WALLET = 'wallet'
}
```

### ReservationStatus
```typescript
enum ReservationStatus {
  RESERVED = 'reserved',
  CONFIRMED = 'confirmed',
  RELEASED = 'released',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}
```

## Checkout Flow

```
1. Cart: findOrCreate + addItem
2. Address: create shipping + billing
3. StockReservation: reserveStock for each item
4. PaymentIntent: create with amount
5. Payment Gateway: process payment
6. On Success:
   - StockReservation.confirm(orderId)
   - PaymentIntent.capture()
   - Order.create()
   - Cart.clear()
7. Shipment: create with tracking
8. Shipment: addTrackingEvent as package moves
```

## Common Queries

```typescript
// User's addresses
Address.find({ userId, isDefault: true });

// Active cart for user
Cart.findOne({ userId, expiresAt: { $gt: new Date() } });

// User's shipments
Shipment.find({ userId }).sort({ createdAt: -1 });

// Pending payments
PaymentIntent.find({ 
  userId, 
  status: PaymentStatus.PENDING 
});

// Active reservations for product
StockReservation.find({
  productId,
  status: ReservationStatus.RESERVED,
  expiresAt: { $gt: new Date() }
});

// Release expired reservations (cron)
await StockReservation.releaseExpired();
```

## Validation Rules

| Field | Rule |
|-------|------|
| phone | `/^[0-9]{10}$/` (10 digits) |
| pincode | `/^[0-9]{6}$/` (6 digits) |
| quantity | min: 1 |
| amount | min: 0 |
| expiresAt | Auto-set (7 days for cart, 15 min for others) |
| ULID | 26 characters (time-sortable) |

## Key Indexes

```typescript
// Address
{ userId: 1, isDefault: 1 }
{ pincode: 1, city: 1 }

// Cart
{ userId: 1, createdAt: -1 }
{ expiresAt: 1 } // TTL

// Shipment
{ orderId: 1, status: 1 }
{ trackingNumber: 1, carrier: 1 }

// PaymentIntent
{ orderId: 1, status: 1 }
{ gateway: 1, gatewayTransactionId: 1 }

// StockReservation
{ productId: 1, variantId: 1, status: 1 }
{ expiresAt: 1 } // TTL
```

## Testing

```bash
# Run checkout model tests
cd apps/api
RUN_INTEGRATION=true pnpm test checkout.spec.ts

# Results: 22 tests passing
```

## Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/models/Address.ts` | ~170 | Address model with validation |
| `src/models/Cart.ts` | ~330 | Cart with auto-totals |
| `src/models/Shipment.ts` | ~310 | Shipment tracking |
| `src/models/PaymentIntent.ts` | ~400 | Payment processing |
| `src/models/StockReservation.ts` | ~330 | Inventory reservation |
| `tests/checkout.spec.ts` | ~460 | Comprehensive tests |
| `docs/CHECKOUT_MODELS.md` | ~700 | Full documentation |

---

**Total**: ~2,700 lines of code + documentation  
**Status**: ✅ Complete (Feature #174)
