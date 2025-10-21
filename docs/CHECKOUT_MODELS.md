# Checkout Domain Models (Feature #174)

## Overview

This document describes the five core domain models that power the NearbyBazaar checkout and order fulfillment process. These models provide a robust foundation for e-commerce operations with support for inventory management, payment processing, and order tracking.

## Models

### 1. Address Model

**Purpose**: Stores user shipping and billing addresses with validation.

**File**: `apps/api/src/models/Address.ts`

**Key Features**:
- Support for multiple address types (home, work, billing, shipping, other)
- Phone number validation (10-digit format)
- Pincode validation (6-digit format)
- Default address flag (only one per user)
- Optional GPS coordinates for location-based services
- Full address virtual property for display

**Schema Fields**:
```typescript
{
  userId: ObjectId,           // User who owns this address
  type: AddressType,          // home, work, billing, shipping, other
  fullName: string,           // Recipient name
  phone: string,              // 10-digit phone number
  addressLine1: string,       // Primary address line
  addressLine2?: string,      // Secondary address line (optional)
  landmark?: string,          // Nearby landmark for delivery
  city: string,               // City name
  state: string,              // State/province
  pincode: string,            // 6-digit postal code
  country: string,            // Default: 'IN'
  isDefault: boolean,         // Is this the default address?
  coordinates?: {             // Optional GPS coordinates
    latitude: number,
    longitude: number
  },
  metadata?: object           // Additional custom data
}
```

**Indexes**:
- `userId` + `isDefault`
- `pincode` + `city`
- `city`, `state` (individual)

**Methods**:
- `isServiceable()`: Check if address is in serviceable area (stub)

**Pre-save Hook**: Automatically unsets other default addresses when a new one is marked as default.

### 2. Cart Model

**Purpose**: Manages shopping cart with items, pricing, and addresses.

**File**: `apps/api/src/models/Cart.ts`

**Key Features**:
- Support for both logged-in users and guest sessions
- Automatic TTL (7 days expiration)
- Auto-calculation of subtotal, discount, tax, and total
- Item quantity management
- Coupon code support
- Address linking for checkout

**Schema Fields**:
```typescript
{
  userId?: ObjectId,          // User (optional for guest carts)
  sessionId?: string,         // Guest session identifier
  items: [{
    itemId: ObjectId,         // Product or Service ID
    itemType: 'product' | 'service',
    variantId?: string,       // Product variant (size, color, etc.)
    quantity: number,         // Number of units
    price: number,            // Unit price at time of adding
    discount?: number,        // Discount per unit
    tax?: number,             // Tax per unit
    metadata?: object         // Additional data
  }],
  subtotal: number,           // Sum of (price * quantity)
  discount: number,           // Total discount
  tax: number,                // Total tax
  total: number,              // subtotal - discount + tax
  couponCode?: string,        // Applied coupon
  shippingAddressId?: ObjectId,
  billingAddressId?: ObjectId,
  expiresAt: Date             // Auto-expiry date
}
```

**Indexes**:
- `userId` + `createdAt`
- `sessionId` + `createdAt`
- `expiresAt` (TTL index for auto-deletion)

**Methods**:
- `addItem(item)`: Add or update item in cart
- `removeItem(itemId)`: Remove item from cart
- `updateItemQuantity(itemId, quantity)`: Update item quantity
- `clear()`: Empty the cart
- `calculateTotals()`: Recalculate all pricing (called automatically)

**Static Methods**:
- `findOrCreate(userId, sessionId)`: Get existing cart or create new one

**Virtuals**:
- `itemCount`: Total number of items (sum of quantities)

**Pre-save Hook**: Sets default expiry (7 days) and recalculates totals.

### 3. Shipment Model

**Purpose**: Tracks order shipments with carrier information and status updates.

**File**: `apps/api/src/models/Shipment.ts`

**Key Features**:
- ULID-based human-readable IDs
- Multi-package support
- Tracking event history with timeline
- Auto-set delivery date when status changes to delivered
- Support for dimensions and weight
- Carrier and tracking number management

**Schema Fields**:
```typescript
{
  shipmentId: string,         // ULID (26 characters)
  orderId: ObjectId,          // Associated order
  vendorId: ObjectId,         // Vendor fulfilling the order
  userId: ObjectId,           // Buyer
  carrier: string,            // Carrier name (Delhivery, Shiprocket, etc.)
  trackingNumber?: string,    // Carrier tracking number
  trackingUrl?: string,       // URL to track shipment
  status: ShipmentStatus,     // Current status
  shippingMethod: string,     // Standard, Express, etc.
  shippingCost: number,       // Shipping fee
  weight?: number,            // Package weight
  dimensions?: {              // Package dimensions
    length: number,
    width: number,
    height: number,
    unit: 'cm' | 'in'
  },
  packageCount: number,       // Number of packages
  shippingAddress: {          // Delivery address snapshot
    fullName: string,
    phone: string,
    addressLine1: string,
    addressLine2?: string,
    city: string,
    state: string,
    pincode: string,
    country: string
  },
  estimatedDeliveryDate?: Date,
  actualDeliveryDate?: Date,
  trackingEvents: [{          // Event timeline
    timestamp: Date,
    status: ShipmentStatus,
    location?: string,
    description: string,
    metadata?: object
  }],
  notes?: string,
  metadata?: object
}
```

**Statuses**: 
- `pending`: Not yet shipped
- `label_created`: Shipping label generated
- `picked_up`: Carrier picked up package
- `in_transit`: Package is moving
- `out_for_delivery`: On delivery vehicle
- `delivered`: Successfully delivered
- `failed`: Delivery failed
- `returned`: Returned to sender
- `cancelled`: Shipment cancelled

**Indexes**:
- `shipmentId` (unique)
- `orderId` + `status`
- `vendorId` + `status` + `createdAt`
- `userId` + `createdAt`
- `trackingNumber` + `carrier`

**Methods**:
- `addTrackingEvent(event)`: Add tracking event and update status
- `updateStatus(status, description)`: Convenience method to update status

**Virtuals**:
- `isDelivered`: Check if status is delivered
- `isInTransit`: Check if status is picked_up, in_transit, or out_for_delivery
- `latestTracking`: Get most recent tracking event

**Pre-save Hook**: Adds initial tracking event when shipment is created.

### 4. PaymentIntent Model

**Purpose**: Manages payment processing with gateway integration and refund tracking.

**File**: `apps/api/src/models/PaymentIntent.ts`

**Key Features**:
- ULID-based payment intent IDs
- Multi-gateway support (PhonePe, Razorpay, Stripe, COD, Wallet)
- Automatic expiry (15 minutes for pending intents)
- Partial and full refund support
- Gateway response and error tracking
- Capture and cancellation workflows

**Schema Fields**:
```typescript
{
  paymentIntentId: string,    // ULID (26 characters)
  orderId: ObjectId,          // Associated order
  userId: ObjectId,           // Buyer
  vendorId?: ObjectId,        // Vendor (for split payments)
  amount: number,             // Payment amount
  currency: string,           // Default: 'INR'
  status: PaymentStatus,      // Current status
  gateway: PaymentGateway,    // phonepe, razorpay, stripe, cod, wallet
  gatewayTransactionId?: string,  // Gateway's transaction ID
  gatewayOrderId?: string,    // Gateway's order ID
  gatewayPaymentMethod?: string,  // Card, UPI, Net Banking, etc.
  capturedAmount: number,     // Amount captured
  refundedAmount: number,     // Amount refunded
  gatewayResponse?: object,   // Raw gateway response
  gatewayError?: {            // Error details
    code: string,
    message: string,
    details?: object
  },
  refunds: [{                 // Refund history
    refundId: string,         // ULID
    amount: number,
    reason?: string,
    status: 'pending' | 'succeeded' | 'failed',
    gatewayRefundId?: string,
    createdAt: Date,
    processedAt?: Date,
    metadata?: object
  }],
  expiresAt?: Date,           // Intent expiry (15 mins for pending)
  capturedAt?: Date,
  failedAt?: Date,
  metadata?: object
}
```

**Statuses**:
- `pending`: Awaiting payment
- `processing`: Payment in progress
- `requires_action`: Needs user action (3DS, OTP, etc.)
- `requires_capture`: Authorized but not captured
- `succeeded`: Payment successful
- `failed`: Payment failed
- `cancelled`: Intent cancelled
- `refunded`: Fully refunded
- `partially_refunded`: Partially refunded

**Gateways**:
- `phonepe`: PhonePe UPI payments
- `razorpay`: Razorpay integration
- `stripe`: Stripe integration
- `cod`: Cash on Delivery
- `wallet`: NearbyBazaar wallet

**Indexes**:
- `paymentIntentId` (unique)
- `orderId` + `status`
- `userId` + `createdAt`
- `vendorId` + `status` + `createdAt`
- `gateway` + `gatewayTransactionId`
- `status` + `expiresAt`

**Methods**:
- `canCapture()`: Check if payment can be captured
- `canRefund()`: Check if payment can be refunded
- `capture(amount?)`: Capture authorized payment
- `refund(amount, reason?)`: Refund payment (partial or full)
- `cancel()`: Cancel pending intent

**Virtuals**:
- `availableRefundAmount`: Amount available for refund
- `isExpired`: Check if intent has expired

**Pre-save Hook**: Sets 15-minute expiry for pending intents.

### 5. StockReservation Model

**Purpose**: Temporarily reserves inventory during checkout to prevent overselling.

**File**: `apps/api/src/models/StockReservation.ts`

**Key Features**:
- ULID-based reservation IDs
- TTL-based auto-expiry (default 15 minutes)
- Support for product variants
- Confirmation workflow (reserve → confirm → order)
- Manual release capability
- Expiry extension for slow checkouts
- Active reservation tracking

**Schema Fields**:
```typescript
{
  reservationId: string,      // ULID (26 characters)
  productId: ObjectId,        // Product being reserved
  variantId?: string,         // Product variant (size, color, etc.)
  quantity: number,           // Reserved quantity
  userId: ObjectId,           // User reserving stock
  orderId?: ObjectId,         // Order ID after confirmation
  cartId?: ObjectId,          // Associated cart
  status: ReservationStatus,  // Current status
  expiresAt: Date,            // Expiry time (default 15 mins)
  confirmedAt?: Date,         // When reservation was confirmed
  releasedAt?: Date,          // When reservation was released
  metadata?: object
}
```

**Statuses**:
- `reserved`: Stock is held
- `confirmed`: Reservation converted to order
- `released`: Stock returned (manual release)
- `expired`: Reservation expired (TTL)
- `cancelled`: Reservation cancelled

**Indexes**:
- `reservationId` (unique)
- `productId` + `variantId` + `status`
- `userId` + `status` + `createdAt`
- `orderId`
- `status` + `expiresAt`
- `expiresAt` (TTL index for auto-expiry)

**Methods**:
- `confirm(orderId)`: Confirm reservation and link to order
- `release()`: Manually release reservation
- `extend(minutes)`: Extend expiry time
- `isExpired()`: Check if reservation has expired

**Static Methods**:
- `reserveStock(productId, quantity, userId, options)`: Create new reservation
- `releaseExpired()`: Batch release expired reservations (for cron job)
- `getActiveReservations(productId, variantId?)`: Count active reservations for a product

**Virtuals**:
- `timeRemaining`: Seconds until expiry
- `isActive`: Check if reservation is active (reserved + not expired)

**Pre-save Hook**: Sets default 15-minute expiry if not provided.

## Integration Flow

### Complete Checkout Process

```
1. User adds items to Cart
   ↓
2. Cart calculates totals with tax/discount
   ↓
3. User selects/creates Address (shipping + billing)
   ↓
4. System creates StockReservation for each cart item
   ↓
5. User initiates payment → PaymentIntent created
   ↓
6. Payment gateway processes payment
   ↓
7. On success:
   - Reservation.confirm(orderId)
   - PaymentIntent.capture()
   - Actual stock decremented from Product
   - Order created
   - Cart cleared
   ↓
8. Vendor creates Shipment with tracking
   ↓
9. Shipment.addTrackingEvent() as package moves
   ↓
10. Shipment delivered → Order completed
```

### Reservation Expiry Flow

```
StockReservation created (15 min TTL)
   ↓
If payment not completed in 15 mins:
   ↓
MongoDB TTL index auto-deletes document
   ↓
Cron job (optional): StockReservation.releaseExpired()
   ↓
Stock returned to Product inventory
```

### Refund Flow

```
User requests refund
   ↓
Check PaymentIntent.canRefund()
   ↓
PaymentIntent.refund(amount, reason)
   ↓
Gateway processes refund
   ↓
Update commission ledger (reverse commission)
   ↓
Update order status
   ↓
Optionally create reverse Shipment for return
```

## Environment Variables

No new environment variables required. Uses existing:
- `MONGODB_URI`: Database connection
- `LOG_LEVEL`: Logging verbosity

## Testing

**Test File**: `apps/api/tests/checkout.spec.ts`

**Coverage**: 22 tests covering:
- Address validation and virtuals
- Cart totals calculation
- Shipment status transitions
- Payment intent capture/refund logic
- Stock reservation expiry
- Integration scenario (full checkout flow)

**Run Tests**:
```bash
cd apps/api
RUN_INTEGRATION=true pnpm test checkout.spec.ts
```

**Results**: All 22 tests passing ✓

## Database Indexes

All models include optimized indexes for common query patterns:
- User lookups (userId indexes)
- Status filtering (status indexes)
- Date range queries (createdAt indexes)
- TTL auto-deletion (expiresAt indexes)
- Unique constraints (IDs, tracking numbers)

## Performance Considerations

1. **Cart TTL**: Auto-deletes abandoned carts after 7 days
2. **Reservation TTL**: Auto-expires reservations after 15 minutes
3. **Payment Intent TTL**: Expires pending intents after 15 minutes
4. **Indexes**: Compound indexes for common query patterns
5. **Atomic Updates**: Use MongoDB atomic operations for stock reservation

## TODO / Future Enhancements

- [ ] Integrate StockReservation with actual Product inventory
- [ ] Add webhook notifications for payment status changes
- [ ] Implement multi-warehouse stock reservation logic
- [ ] Add support for split payments (multiple vendors)
- [ ] Integrate with actual shipping carrier APIs
- [ ] Add fraud detection in PaymentIntent
- [ ] Implement cart merge for guest → logged-in user
- [ ] Add cart abandonment email reminders
- [ ] Implement reservation priority queue for low-stock items
- [ ] Add address auto-complete with Google Maps API

## Related Documentation

- Feature #173: Request-ID, Idempotency, Structured Logs
- Feature #175: Checkout API (next feature)
- Feature #176: Payments: PhonePe/UPI (next feature)
- Feature #178: Tax Engine (GST) (future)
- Feature #179: Shipping Integrations (future)
- Feature #180: Inventory: Multi-warehouse + Reservations (future)

## API Examples

### Create Address
```typescript
const address = await Address.create({
  userId: req.user._id,
  type: AddressType.SHIPPING,
  fullName: 'John Doe',
  phone: '9876543210',
  addressLine1: '123 Main St',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  country: 'IN',
  isDefault: true
});
```

### Add to Cart
```typescript
let cart = await Cart.findOrCreate(req.user._id);
await cart.addItem({
  itemId: productId,
  itemType: 'product',
  quantity: 2,
  price: 999,
  tax: 179.82
});
```

### Reserve Stock
```typescript
const reservation = await StockReservation.reserveStock(
  productId,
  quantity,
  req.user._id,
  {
    variantId: 'size-M',
    cartId: cart._id,
    expiryMinutes: 15
  }
);
```

### Create Payment Intent
```typescript
const payment = await PaymentIntent.create({
  orderId: order._id,
  userId: req.user._id,
  amount: cart.total,
  currency: 'INR',
  gateway: PaymentGateway.PHONEPE
});
```

### Track Shipment
```typescript
await shipment.addTrackingEvent({
  status: ShipmentStatus.IN_TRANSIT,
  location: 'Mumbai Hub',
  description: 'Package arrived at sorting facility'
});
```

## Maintenance

### Cleanup Expired Reservations (Cron Job)
```typescript
// Run this every 5 minutes
const released = await StockReservation.releaseExpired();
console.log(`Released ${released} expired reservations`);
```

### Monitor Active Reservations
```typescript
const activeCount = await StockReservation.getActiveReservations(productId);
const availableStock = product.stock - activeCount;
```

---

**Status**: ✅ Complete  
**Date**: 2025-01-20  
**Models**: 5 (Address, Cart, Shipment, PaymentIntent, StockReservation)  
**Tests**: 22 passing  
**Lines of Code**: ~1,500
