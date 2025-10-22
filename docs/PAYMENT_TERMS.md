# Bulk Order Payment Terms - Feature #242

## Overview

Implements flexible payment terms for bulk B2B orders, including partial advance payments, net payment periods (Net 30/60), and credit management. Includes admin credit approval workflow and automated credit ledger tracking.

## Key Features

### 1. Payment Term Types ✅

- **Full Advance**: 100% payment upfront
- **Partial Advance**: e.g., 30% advance, 70% on delivery
- **Net Days**: Net 30, Net 60 credit terms (deferred payment)
- **COD**: Cash on delivery
- **Custom**: Custom payment arrangements

### 2. Buyer Credit Management ✅

- Credit limit approval workflow
- Available credit tracking
- Outstanding balance monitoring
- Credit utilization percentage
- Risk-based credit assessment (low/medium/high)

### 3. Order Payment Tracking ✅

- Payment status (unpaid, partial, paid, overdue)
- Credit allocation on order placement
- Payment recording and credit release
- Automatic overdue detection

### 4. Admin Controls ✅

- Credit application review and approval
- Credit limit management
- Buyer risk assessment
- Credit suspension for late payments
- Payment term template management

## Database Models

### 1. PaymentTermTemplate Model

**File**: `apps/api/src/models/CreditTerm.ts`

```typescript
{
  name: string                    // e.g., "Net 30", "30/70 Split"
  description?: string
  type: PaymentTermType           // full_advance | partial_advance | net_days | cod | custom

  // For partial_advance
  advancePercentage?: number      // e.g., 30 for 30% advance

  // For net_days
  netDays?: number                // e.g., 30 for Net 30

  // General
  daysUntilDue?: number
  lateFeePercentage?: number

  // Conditions
  minOrderValue?: number
  requiresApproval: boolean
  isActive: boolean

  timestamps: true
}
```

### 2. BuyerCredit Model

**File**: `apps/api/src/models/CreditTerm.ts`

```typescript
{
  userId: ObjectId                // Reference to User

  // Credit Limits
  creditLimit: number             // Total approved credit
  availableCredit: number         // Remaining available
  outstandingAmount: number       // Currently owed
  totalCreditUsed: number         // Lifetime usage

  // Approval
  approvedBy?: ObjectId           // Admin who approved
  approvedAt?: Date

  // Terms
  defaultPaymentTermId?: ObjectId // Default payment term
  maxNetDays: number              // Maximum net days allowed

  // Risk Assessment
  creditScore?: number            // 0-100
  riskLevel: 'low' | 'medium' | 'high'

  // Status
  status: 'pending' | 'approved' | 'suspended' | 'rejected'

  // History
  lastReviewDate?: Date
  notes?: string

  timestamps: true
}
```

**Virtual Fields**:

- `utilizationPercentage`: `(outstandingAmount / creditLimit) * 100`

**Methods**:

- `hasAvailableCredit(amount)`: Check if credit available
- `allocateCredit(amount)`: Reserve credit for order
- `releaseCredit(amount)`: Release credit (order cancelled)
- `recordPayment(amount)`: Record payment received

### 3. Extended Order Model

**File**: `apps/api/src/models/Order.ts`

**New Fields**:

```typescript
{
  // Payment Terms
  paymentTerms?: {
    type: 'full_advance' | 'partial_advance' | 'net_days' | 'cod' | 'custom'
    advancePercentage?: number
    netDays?: number
    dueDate?: Date
    description?: string
  }

  // Credit Tracking
  creditUsed: number              // Amount using credit
  outstandingAmount: number       // Amount still owed
  paidAmount: number              // Amount paid so far

  // Payment Status
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overdue'
}
```

## API Endpoints

### Buyer Endpoints

#### 1. Apply for Credit

**POST** `/v1/credit/apply`

Apply for business credit.

**Request**:

```json
{
  "userId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "requestedAmount": 500000,
  "notes": "B2B retailer, expected monthly orders of ₹100,000"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "65f1a2b3c4d5e6f7g8h9i0j1",
    "creditLimit": 500000,
    "status": "pending",
    "createdAt": "2025-10-20T..."
  },
  "message": "Credit application submitted. Pending admin approval."
}
```

#### 2. Get Credit Summary

**GET** `/v1/credit/summary/:userId`

Get comprehensive credit summary with outstanding orders.

**Response**:

```json
{
  "success": true,
  "data": {
    "credit": {
      "creditLimit": 500000,
      "availableCredit": 350000,
      "outstandingAmount": 150000,
      "status": "approved",
      "riskLevel": "low",
      "maxNetDays": 60,
      "utilizationPercentage": 30
    },
    "outstandingOrders": [
      {
        "_id": "...",
        "total": 150000,
        "paidAmount": 0,
        "outstandingAmount": 150000,
        "paymentTerms": {
          "type": "net_days",
          "netDays": 30,
          "dueDate": "2025-11-19T..."
        },
        "paymentStatus": "unpaid"
      }
    ],
    "overdueCount": 0
  }
}
```

#### 3. Check Credit Availability

**POST** `/v1/credit/check`

Check if buyer has sufficient credit for order.

**Request**:

```json
{
  "userId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "orderAmount": 75000
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "available": true,
    "credit": {
      /* credit details */
    }
  }
}
```

#### 4. Record Payment

**POST** `/v1/credit/payment`

Record payment against order.

**Request**:

```json
{
  "userId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "orderId": "65f1a2b3c4d5e6f7g8h9i0j2",
  "paymentAmount": 150000
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "paymentAmount": 150000,
    "creditPayment": 150000,
    "newOutstanding": 0,
    "order": {
      /* updated order */
    },
    "credit": {
      /* updated credit */
    }
  },
  "message": "Payment recorded successfully"
}
```

### Admin Endpoints

#### 5. List Credit Applications

**GET** `/v1/credit/admin/applications?status=pending&page=1&limit=20`

List all credit applications with filters.

**Query Parameters**:

- `status`: pending | approved | rejected | suspended (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### 6. Approve Credit

**POST** `/v1/credit/admin/approve`

Approve credit application.

**Request**:

```json
{
  "userId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "approvedBy": "ADMIN_USER_ID",
  "creditLimit": 500000,
  "paymentTermId": "PAYMENT_TERM_ID",
  "maxNetDays": 60,
  "riskLevel": "low"
}
```

#### 7. Reject Credit

**POST** `/v1/credit/admin/reject`

Reject credit application.

**Request**:

```json
{
  "userId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "reason": "Insufficient business documentation"
}
```

#### 8. Update Credit Limit

**PUT** `/v1/credit/admin/limit`

Modify approved credit limit.

**Request**:

```json
{
  "userId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "newLimit": 750000,
  "updatedBy": "ADMIN_USER_ID"
}
```

#### 9. Suspend Credit

**POST** `/v1/credit/admin/suspend`

Suspend buyer's credit (e.g., for late payments).

**Request**:

```json
{
  "userId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "reason": "Multiple overdue payments"
}
```

#### 10. Mark Overdue Orders

**POST** `/v1/credit/admin/mark-overdue`

Cron job endpoint to mark orders as overdue.

**Response**:

```json
{
  "success": true,
  "data": { "markedOverdue": 5 },
  "message": "Marked 5 orders as overdue"
}
```

### Payment Term Templates

#### 11. List Payment Terms

**GET** `/v1/credit/terms?activeOnly=true`

Get available payment term templates.

#### 12. Create Payment Term Template

**POST** `/v1/credit/admin/terms`

Create new payment term template (admin).

**Request**:

```json
{
  "name": "30/70 Split",
  "description": "30% advance, 70% on delivery",
  "type": "partial_advance",
  "advancePercentage": 30,
  "minOrderValue": 50000,
  "requiresApproval": true,
  "isActive": true
}
```

#### 13. Get Payment Term by ID

**GET** `/v1/credit/terms/:id`

## Credit Ledger Service

### Key Functions

**File**: `apps/api/src/services/creditLedger.ts`

```typescript
// Buyer Operations
applyForCredit(userId, requestedAmount, notes)
checkCreditAvailability(userId, orderAmount)
getBuyerCreditSummary(userId)

// Admin Operations
approveCredit(userId, approvedBy, creditLimit, ...)
rejectCredit(userId, reason)
updateCreditLimit(userId, newLimit, updatedBy)
suspendCredit(userId, reason)

// Order Operations
allocateOrderCredit(userId, orderId, amount)
releaseOrderCredit(userId, orderId)
recordOrderPayment(userId, orderId, paymentAmount)

// Utilities
calculatePaymentSchedule(orderTotal, paymentTerm)
markOverdueOrders()
listPaymentTermTemplates(activeOnly)
```

### Payment Schedule Calculation

```typescript
// Example: Partial Advance (30/70)
calculatePaymentSchedule(100000, {
  type: 'partial_advance',
  advancePercentage: 30,
});
// Returns: { advance: 30000, onDelivery: 70000 }

// Example: Net 30
calculatePaymentSchedule(100000, {
  type: 'net_days',
  netDays: 30,
});
// Returns: { advance: 0, onDelivery: 0, dueDate: Date(+30 days) }
```

## Order Creation Flow with Payment Terms

### Example: Partial Advance Order

```typescript
// 1. Check credit availability
const check = await checkCreditAvailability(userId, 100000);
if (!check.available) {
  throw new Error(check.reason);
}

// 2. Calculate payment schedule
const schedule = calculatePaymentSchedule(100000, {
  type: 'partial_advance',
  advancePercentage: 30
});
// advance: 30000, onDelivery: 70000

// 3. Create order with payment terms
const order = await Order.create({
  user: userId,
  items: [...],
  total: 100000,
  paymentTerms: {
    type: 'partial_advance',
    advancePercentage: 30,
    description: '30% advance, 70% on delivery'
  },
  creditUsed: 70000,          // Credit portion (onDelivery)
  outstandingAmount: 70000,    // Amount to be paid later
  paidAmount: 30000,           // Advance already paid
  paymentStatus: 'partial'
});

// 4. Allocate credit
await allocateOrderCredit(userId, order._id, 70000);

// 5. User pays ₹30,000 advance now
// Credit of ₹70,000 reserved for later payment
```

### Example: Net 30 Order

```typescript
// 1. Check credit
const check = await checkCreditAvailability(userId, 200000);

// 2. Calculate due date
const schedule = calculatePaymentSchedule(200000, {
  type: 'net_days',
  netDays: 30
});
// dueDate: Date(+30 days)

// 3. Create order
const order = await Order.create({
  user: userId,
  items: [...],
  total: 200000,
  paymentTerms: {
    type: 'net_days',
    netDays: 30,
    dueDate: schedule.dueDate
  },
  creditUsed: 200000,
  outstandingAmount: 200000,
  paidAmount: 0,
  paymentStatus: 'unpaid'
});

// 4. Allocate full credit
await allocateOrderCredit(userId, order._id, 200000);

// 5. No immediate payment required
// User must pay by due date
```

## UI Components

### Admin Credit Approval Page

**File**: `apps/admin/pages/credit/approvals.tsx`

Features:

- List credit applications with filters (pending, approved, etc.)
- Review application details (buyer info, GSTIN, requested amount)
- Approve with custom credit limit, payment term, risk level
- Reject with reason
- Suspend approved credits
- View approval history

### Buyer Credit Dashboard

**File**: `apps/web/pages/b2b/credit.tsx`

Features:

- **No Credit Account**: Application form with requested amount and notes
- **Credit Account Exists**:
  - Credit overview cards (limit, available, outstanding, utilization)
  - Credit terms (max net days, default payment term, risk level)
  - Outstanding orders table with due dates and payment status
  - Overdue alerts
  - Visual utilization bar with color coding

## Workflows

### Credit Application Workflow

```
1. Buyer submits application
   ↓
2. Admin reviews in approval page
   ↓
3. Admin approves or rejects
   ↓
4a. If approved:
    - Credit limit set
    - Available credit = credit limit
    - Buyer can place orders with credit

4b. If rejected:
    - Buyer notified with reason
    - Can reapply later
```

### Order with Credit Workflow

```
1. Buyer selects payment term (e.g., Net 30)
   ↓
2. System checks credit availability
   ↓
3. If sufficient:
   - Allocate credit
   - Create order with payment terms
   - Update buyer's available credit

4. Buyer receives order
   ↓
5. Payment due date approaches
   ↓
6. Buyer pays invoice
   ↓
7. Record payment
   - Release credit
   - Update outstanding amount
   - Restore available credit
```

### Overdue Handling

```
1. Cron job runs daily
   POST /v1/credit/admin/mark-overdue
   ↓
2. Check orders with:
   - paymentStatus: 'unpaid' or 'partial'
   - dueDate < now
   ↓
3. Mark as 'overdue'
   ↓
4. Admin reviews overdue accounts
   ↓
5. Admin may suspend credit if needed
```

## Integration with Other Features

### B2B Buyer Accounts (Feature #240)

- Credit is only available for B2B accounts
- Business GSTIN required for higher credit limits
- Business profile details shown in credit application

### GST Invoicing (Feature #241)

- Invoices reflect payment terms
- Show advance paid vs. outstanding
- Due dates on invoices
- Payment tracking linked to invoices

### RFQ System (Feature #238)

- Vendors can offer credit terms in quotes
- Credit-approved buyers see flexible payment options
- Payment terms included in accepted quotes

## Security & Validation

### Credit Checks

- Verify buyer has approved credit before allocating
- Prevent over-allocation (available credit check)
- Atomic updates to avoid race conditions

### Admin Authorization

- Only admins can approve/reject/suspend credit
- All admin actions logged to audit trail
- Credit limit changes require admin approval

### Fraud Prevention

- Risk-based credit limits
- Monitor payment patterns
- Auto-suspend on excessive overdue
- Credit score tracking (placeholder for future ML)

## Testing

### Manual Testing Scenarios

#### 1. Credit Application

```bash
# Apply for credit
curl -X POST http://localhost:4000/v1/credit/apply \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "requestedAmount": 500000,
    "notes": "B2B retailer"
  }'

# Check application status
curl http://localhost:4000/v1/credit/summary/USER_ID
```

#### 2. Admin Approval

```bash
# Approve credit
curl -X POST http://localhost:4000/v1/credit/admin/approve \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "approvedBy": "ADMIN_ID",
    "creditLimit": 500000,
    "maxNetDays": 60,
    "riskLevel": "low"
  }'
```

#### 3. Credit Check

```bash
# Check availability
curl -X POST http://localhost:4000/v1/credit/check \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "orderAmount": 100000
  }'
```

#### 4. Record Payment

```bash
# Record payment
curl -X POST http://localhost:4000/v1/credit/payment \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "orderId": "ORDER_ID",
    "paymentAmount": 100000
  }'
```

### Test Cases

- [ ] Buyer applies for credit successfully
- [ ] Admin approves credit, buyer sees updated status
- [ ] Buyer places order with Net 30 terms
- [ ] Credit is allocated, available credit decreases
- [ ] Order payment recorded, credit released
- [ ] Attempt order with insufficient credit (should fail)
- [ ] Overdue order marked correctly after due date
- [ ] Admin suspends credit, buyer cannot place new orders
- [ ] Partial payment updates outstanding correctly
- [ ] Multiple orders track credit utilization properly

## Future Enhancements

### Phase 1 (Current) ✅

- Basic credit approval workflow
- Payment term templates
- Order credit tracking
- Admin approval UI
- Buyer credit dashboard

### Phase 2 (Planned)

- [ ] Auto-approval for low-risk buyers based on criteria
- [ ] Credit score calculation using ML
- [ ] Interest charges for late payments
- [ ] Credit increase requests from buyers
- [ ] Email notifications (application status, payment due, overdue)
- [ ] Credit history and payment reports

### Phase 3 (Advanced)

- [ ] Integration with external credit bureaus (CIBIL, Experian)
- [ ] Automated underwriting based on business data
- [ ] Dynamic credit limits based on performance
- [ ] Credit insurance options
- [ ] Multi-currency credit management
- [ ] Vendor-specific credit terms (marketplace model)

## Configuration

### Environment Variables

```bash
# Credit defaults
DEFAULT_MAX_NET_DAYS=30
DEFAULT_RISK_LEVEL=medium
MIN_CREDIT_LIMIT=10000

# Late fees
LATE_FEE_PERCENTAGE=2
LATE_FEE_GRACE_DAYS=7

# Admin notifications
CREDIT_ADMIN_EMAIL=credit@nearbybazaar.com
```

### Cron Jobs

Set up daily cron to mark overdue orders:

```bash
# Daily at midnight
0 0 * * * curl -X POST http://localhost:4000/v1/credit/admin/mark-overdue
```

## Troubleshooting

### Issue: Credit Not Allocated

**Symptoms**: Order created but credit not deducted
**Solution**: Check if `allocateOrderCredit` was called after order creation

### Issue: Payment Not Updating Credit

**Symptoms**: Payment recorded but available credit not increased
**Solution**: Verify `recordOrderPayment` is using correct userId and orderId

### Issue: Duplicate Credit Allocation

**Symptoms**: Multiple orders allocating same credit
**Solution**: Use atomic operations in `allocateCredit` method, ensure transaction handling

### Issue: Overdue Not Detected

**Symptoms**: Orders past due date not marked overdue
**Solution**: Verify cron job is running, check that dueDate is set correctly

## Related Documentation

- [B2B Buyer Accounts](./B2B_BUYER_ACCOUNTS.md) - Feature #240
- [GST Invoicing](./GST_INVOICING.md) - Feature #241
- [RFQ System](./RFQ.md) - Feature #238

## Support

For implementation questions or issues:

- Check audit logs for credit operations
- Review buyer credit summary endpoint for discrepancies
- Verify payment term calculations with test data
- Contact platform team for credit limit adjustments

---

**Status**: ✅ Completed  
**Version**: 1.0  
**Last Updated**: 2025-10-20
