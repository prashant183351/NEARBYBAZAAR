# Return Merchandise Authorization (RMA) System - STUB

## ⚠️ Status: Planning/Stub Phase

This is a **stub implementation** for the RMA (Return Merchandise Authorization) system. The data models and API structure are defined, but full business logic, integrations, and workflows are **not yet implemented**.

## Overview

The RMA system handles the complex multi-party workflow for product returns in a dropshipping scenario, involving:

- **Customer**: Initiates return request
- **Vendor**: Reviews and approves/rejects
- **Supplier**: Reviews dropship returns (optional)
- **System**: Coordinates shipment, inspection, and refund

## Data Model

### Return Document (`apps/api/src/models/Return.ts`)

```typescript
{
  rmaNumber: string,              // Unique RMA-2025-001234
  orderId: ObjectId,              // Original order
  customerId: ObjectId,
  vendorId: ObjectId,
  supplierId?: ObjectId,          // For dropship orders

  items: ReturnItem[],            // Items being returned
  status: ReturnStatus,           // Current state
  isDropship: boolean,

  // Communication
  customerNotes?: string,
  vendorNotes?: string,
  supplierNotes?: string,
  internalNotes?: string,         // Private notes

  // Shipment tracking
  returnShipment?: {
    carrier?: string,
    trackingNumber?: string,
    shippedAt?: Date,
    labelUrl?: string,
    labelCost?: number,
  },

  // Inspection results
  inspection?: {
    inspectedBy: ObjectId,
    inspectorType: 'vendor' | 'supplier',
    inspectedAt: Date,
    passed: boolean,
    notes?: string,
    images?: string[],
  },

  // Refund details
  refund?: {
    method: RefundMethod,
    amount: number,
    transactionId?: string,
    processedAt?: Date,
  },

  // Timestamps
  requestedAt: Date,
  expectedResolutionDate?: Date,
  resolvedAt?: Date,
}
```

### Return Status Flow

```
┌─────────────┐
│  requested  │ ─── Customer initiates return
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ vendor_reviewing │ ─── Vendor reviews request
└──────┬───────────┘
       │
       ├─ approve ─► ┌──────────────────────┐
       │             │ supplier_reviewing   │ (if dropship)
       │             └──────┬───────────────┘
       │                    │
       │                    ├─ approve ─► return_label_sent
       │                    └─ reject ──► supplier_rejected
       │
       ├─ approve ─► return_label_sent (if not dropship)
       │
       └─ reject ──► vendor_rejected

┌──────────────────┐
│ return_label_sent│ ─── Label sent to customer
└──────┬───────────┘
       │
       ▼
┌──────────────┐
│ shipped_back │ ─── Customer ships item back
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ received_by_vendor  │ or received_by_supplier
└──────┬──────────────┘
       │
       ▼
┌────────────┐
│ inspecting │ ─── Check item condition
└──────┬─────┘
       │
       ├─ pass ──► inspection_passed ──► refund_processing ──► refunded
       │
       └─ fail ──► inspection_failed ──► (dispute/partial refund)

Terminal States:
  • refunded
  • partially_refunded
  • replaced
  • vendor_rejected
  • supplier_rejected
  • closed
  • cancelled
```

### Return Reasons

- `defective`: Item is defective or broken
- `wrong_item`: Wrong product shipped
- `not_as_described`: Product doesn't match description
- `changed_mind`: Customer changed mind
- `damaged_in_shipping`: Damaged during delivery
- `sizing_issue`: Wrong size/fit
- `quality_issue`: Quality not as expected
- `arrived_late`: Delivery too late
- `other`: Other reason

### Refund Methods

- `original_payment`: Refund to original payment method
- `store_credit`: Issue store credit/wallet balance
- `replacement`: Send replacement item
- `partial_refund`: Partial refund (restocking fees, etc.)

## API Endpoints (Stub)

All endpoints in `apps/api/src/routes/returns.ts` are **stubs** with TODO comments for future implementation.

### Customer Endpoints

#### POST /api/returns

Create a return request.

**Request:**

```json
{
  "orderId": "...",
  "items": [
    {
      "productId": "...",
      "quantity": 1,
      "reason": "defective",
      "condition": "Item not working",
      "images": ["https://..."]
    }
  ],
  "customerNotes": "Power button doesn't work"
}
```

#### GET /api/returns

List customer's returns.

#### GET /api/returns/:id

Get return details.

### Vendor Endpoints

#### PUT /api/returns/:id/vendor-review

Approve or reject return.

**Request:**

```json
{
  "approved": true,
  "notes": "Return approved, label sent"
}
```

#### PUT /api/returns/:id/inspection

Record inspection results.

**Request:**

```json
{
  "passed": true,
  "notes": "Item in good condition",
  "images": ["https://..."]
}
```

#### PUT /api/returns/:id/refund

Process refund.

**Request:**

```json
{
  "method": "original_payment",
  "amount": 1499.0,
  "notes": "Full refund issued"
}
```

### Supplier Endpoints (Dropship)

#### PUT /api/returns/:id/supplier-review

Supplier approval for dropship returns.

### Shared Endpoints

#### PUT /api/returns/:id/shipment

Update return shipment tracking.

**Request:**

```json
{
  "carrier": "BlueDart",
  "trackingNumber": "BD123456789",
  "shippedAt": "2025-10-20T10:00:00Z"
}
```

#### PUT /api/returns/:id/cancel

Cancel return request.

## Service Functions (Stub)

All service functions in `apps/api/src/services/rma.ts` are **stubs** with placeholder logic.

### Key Functions

```typescript
// Check eligibility
isItemEligibleForReturn(orderId, productId);

// Workflow management
getNextStatus(currentStatus, isDropship, action);

// Notifications
notifyReturnStatusChange(returnId, oldStatus, newStatus);

// Shipping
generateReturnLabel(returnId);

// Refunds
processRefund(returnId, amount, method);
calculateRefundAmount(originalAmount, shippingCost, restockingFee);

// Inventory
updateInventoryAfterReturn(returnId, inspectionPassed);

// Analytics
getReturnStatistics(vendorId, supplierId, dateRange);

// Validation
validateReturnRequest(orderId, items);
```

## Workflows

### Standard Return (Non-Dropship)

```
1. Customer initiates return
   └─► Status: requested

2. Vendor reviews and approves
   └─► Status: vendor_approved → return_label_sent
   └─► Generate return shipping label
   └─► Email label to customer

3. Customer ships item back
   └─► Status: shipped_back
   └─► Customer enters tracking info

4. Vendor receives item
   └─► Status: received_by_vendor → inspecting

5. Vendor inspects item
   └─► Status: inspection_passed or inspection_failed

6. If passed, process refund
   └─► Status: refund_processing → refunded
   └─► Process payment gateway refund
   └─► Update inventory
   └─► Notify customer
```

### Dropship Return

```
1. Customer initiates return
   └─► Status: requested

2. Vendor reviews and forwards to supplier
   └─► Status: vendor_approved → supplier_reviewing
   └─► Notify supplier

3. Supplier reviews and approves
   └─► Status: supplier_approved → return_label_sent
   └─► Generate return label (ship to supplier)

4. Customer ships to supplier
   └─► Status: shipped_back → received_by_supplier

5. Supplier inspects and notifies vendor
   └─► Status: inspection_passed

6. Vendor processes refund
   └─► Status: refund_processing → refunded
```

## TODO: Implementation Checklist

### Phase 1: Core Functionality

- [ ] Validate order eligibility (return window, policy)
- [ ] Implement return policy per vendor
- [ ] Auto-generate unique RMA numbers
- [ ] Send email notifications at each status change
- [ ] Integrate with notification system (Feature #144)

### Phase 2: Shipping Integration

- [ ] Integrate with shipping provider (Shiprocket/Delhivery)
- [ ] Generate pre-paid return labels
- [ ] Automatically track return shipments
- [ ] Calculate return shipping costs
- [ ] Determine who pays (customer/vendor/supplier)

### Phase 3: Refund Processing

- [ ] Integrate with payment gateway (Razorpay/Stripe)
- [ ] Process refunds to original payment method
- [ ] Implement store credit system
- [ ] Handle partial refunds
- [ ] Calculate restocking fees
- [ ] Apply vendor-specific return policies

### Phase 4: Inventory Management

- [ ] Update stock after inspection
- [ ] Handle damaged/defective inventory
- [ ] Track return reasons for analytics
- [ ] Update product availability
- [ ] Sync with supplier inventory (dropship)

### Phase 5: UI Components

- [ ] Customer: Return request form
- [ ] Customer: Track return status
- [ ] Vendor: Return review dashboard
- [ ] Vendor: Inspection interface
- [ ] Supplier: Dropship return review
- [ ] Admin: Return analytics

### Phase 6: Advanced Features

- [ ] Automated return approval (low-value items)
- [ ] Instant refund for trusted customers
- [ ] Return analytics dashboard
- [ ] Fraud detection (multiple returns)
- [ ] Return rate alerts
- [ ] RMA chatbot support

## Testing Strategy

### Unit Tests

- [ ] Status transition validation
- [ ] Refund calculation logic
- [ ] Eligibility checks
- [ ] RMA number generation

### Integration Tests

- [ ] End-to-end return workflow
- [ ] Multi-party notification flow
- [ ] Payment gateway refund
- [ ] Shipping label generation

### Edge Cases

- [ ] Multiple items partial return
- [ ] Return after partial fulfillment
- [ ] Concurrent inspection results
- [ ] Refund failures and retries
- [ ] Expired return windows

## Business Rules (To Define)

### Return Window

- Standard: 30 days from delivery
- Extended: 60 days (for certain categories)
- No returns: Perishables, custom items

### Refund Policy

- Full refund: Within 14 days
- Partial refund: 15-30 days (10% restocking fee)
- Store credit only: After 30 days

### Shipping Costs

- Free return shipping: Defective items
- Customer pays: Changed mind, sizing
- Vendor pays: Wrong item, damaged

### Inspection Criteria

- Unopened packaging: Full refund
- Opened but unused: Full refund
- Used/damaged: Partial or no refund

## Metrics to Track

- **Return Rate**: Returns / Total Orders
- **Resolution Time**: Average days to resolve
- **Inspection Pass Rate**: Passed / Total Inspections
- **Refund Amount**: Total refunded per period
- **Top Return Reasons**: Most common reasons
- **Supplier Return Rate**: By supplier (dropship)
- **Fraud Score**: Multiple returns by same customer

## Integration Points

### Payment Gateway

- Razorpay/Stripe refund API
- Store credit/wallet balance

### Shipping Provider

- Return label generation
- Tracking webhooks
- Cost calculation

### Inventory System

- Stock updates after returns
- Damaged inventory tracking

### Notification System (Feature #144)

- Email notifications
- In-app alerts
- SMS updates

### Compliance System (Feature #143)

- Return policy acceptance
- Terms for returns

## Security Considerations

- [ ] Verify customer owns the order
- [ ] Prevent duplicate return requests
- [ ] Rate-limit return submissions
- [ ] Validate refund amounts
- [ ] Audit trail for all actions
- [ ] Secure shipping label URLs

## Future Enhancements

- AI-powered return reason analysis
- Predictive return likelihood
- Automated restocking decisions
- Cross-border return handling
- Return pickup from customer
- Virtual inspection (video call)
- Return insurance integration

---

**Note**: This is a **stub implementation**. All API endpoints, service functions, and workflows require full implementation before production use. The data model and structure are designed to support the complete RMA flow when implemented.
