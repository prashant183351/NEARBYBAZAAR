# Payment Terms & Credit - Quick Reference

## 🚀 Quick Start

### Buyer: Apply for Credit
```bash
POST /v1/credit/apply
{
  "userId": "USER_ID",
  "requestedAmount": 500000,
  "notes": "B2B retailer, expected orders ₹100k/month"
}
```

### Admin: Approve Credit
```bash
POST /v1/credit/admin/approve
{
  "userId": "USER_ID",
  "approvedBy": "ADMIN_ID",
  "creditLimit": 500000,
  "maxNetDays": 60,
  "riskLevel": "low"
}
```

### Check Credit Availability
```bash
POST /v1/credit/check
{
  "userId": "USER_ID",
  "orderAmount": 100000
}
```

### Get Credit Summary
```bash
GET /v1/credit/summary/{userId}
```

## 💳 Payment Term Types

### 1. Full Advance
```json
{
  "type": "full_advance"
}
// 100% payment upfront
```

### 2. Partial Advance (30/70 Split)
```json
{
  "type": "partial_advance",
  "advancePercentage": 30
}
// 30% now, 70% on delivery
```

### 3. Net 30 (Credit)
```json
{
  "type": "net_days",
  "netDays": 30,
  "dueDate": "2025-11-19T00:00:00Z"
}
// Pay in 30 days
```

### 4. Cash on Delivery
```json
{
  "type": "cod"
}
// Pay when received
```

## 📊 Credit Status Flow

```
pending → approved → [active/suspended]
   ↓
rejected
```

## 🎯 Key Metrics

### Credit Utilization
```
Utilization = (outstandingAmount / creditLimit) × 100

<70%  = Good (Green)
70-90% = Moderate (Yellow)
>90%   = High (Red)
```

### Payment Status
- **unpaid**: No payment received
- **partial**: Some payment received
- **paid**: Fully paid
- **overdue**: Past due date, unpaid

## 🔑 Key Endpoints

### Buyer Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/credit/apply` | Apply for credit |
| GET | `/v1/credit/summary/:userId` | Get credit summary |
| POST | `/v1/credit/check` | Check availability |
| POST | `/v1/credit/payment` | Record payment |

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/credit/admin/applications` | List applications |
| POST | `/v1/credit/admin/approve` | Approve credit |
| POST | `/v1/credit/admin/reject` | Reject application |
| PUT | `/v1/credit/admin/limit` | Update limit |
| POST | `/v1/credit/admin/suspend` | Suspend credit |
| POST | `/v1/credit/admin/mark-overdue` | Mark overdue (cron) |

### Payment Terms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/credit/terms` | List templates |
| POST | `/v1/credit/admin/terms` | Create template |
| GET | `/v1/credit/terms/:id` | Get by ID |

## 📝 Order Payment Terms Schema

```typescript
{
  paymentTerms: {
    type: 'partial_advance',
    advancePercentage: 30,
    dueDate: Date,
    description: '30% advance, 70% on delivery'
  },
  creditUsed: 70000,           // Credit portion
  outstandingAmount: 70000,    // Still owed
  paidAmount: 30000,           // Already paid
  paymentStatus: 'partial'     // Current status
}
```

## 🏗️ File Locations

### Backend
- Models: `apps/api/src/models/CreditTerm.ts`
- Service: `apps/api/src/services/creditLedger.ts`
- Routes: `apps/api/src/routes/credit.ts`
- Extended Order: `apps/api/src/models/Order.ts`

### Frontend
- Admin UI: `apps/admin/pages/credit/approvals.tsx`
- Buyer Dashboard: `apps/web/pages/b2b/credit.tsx`

### Documentation
- Full Guide: `docs/PAYMENT_TERMS.md`
- Quick Reference: `docs/PAYMENT_TERMS_QUICK_REFERENCE.md` (this file)

## 🔄 Common Workflows

### Credit Application → Order
```
1. Buyer applies for credit
   POST /v1/credit/apply

2. Admin approves
   POST /v1/credit/admin/approve

3. Buyer checks availability
   POST /v1/credit/check

4. Create order with terms
   POST /v1/orders (with paymentTerms)

5. Allocate credit
   allocateOrderCredit(userId, orderId, amount)

6. Later: Record payment
   POST /v1/credit/payment
```

### Handle Overdue Payment
```
1. Cron runs daily
   POST /v1/credit/admin/mark-overdue

2. Admin reviews overdue
   GET /v1/credit/admin/applications?status=approved
   (filter by overdueCount > 0)

3. Admin may suspend
   POST /v1/credit/admin/suspend
```

## 💡 Examples

### Example 1: Net 30 Order (₹200,000)
```typescript
// Buyer has ₹500k credit limit, ₹500k available

// 1. Check credit
checkCreditAvailability(userId, 200000)
// → available: true

// 2. Create order
Order.create({
  total: 200000,
  paymentTerms: {
    type: 'net_days',
    netDays: 30,
    dueDate: Date(+30 days)
  },
  creditUsed: 200000,
  outstandingAmount: 200000,
  paidAmount: 0,
  paymentStatus: 'unpaid'
})

// 3. Allocate credit
allocateOrderCredit(userId, orderId, 200000)
// → Available credit: ₹300k
// → Outstanding: ₹200k
```

### Example 2: 30/70 Split Order (₹100,000)
```typescript
// 1. Calculate schedule
calculatePaymentSchedule(100000, {
  type: 'partial_advance',
  advancePercentage: 30
})
// → { advance: 30000, onDelivery: 70000 }

// 2. Create order
Order.create({
  total: 100000,
  paymentTerms: {
    type: 'partial_advance',
    advancePercentage: 30
  },
  creditUsed: 70000,
  outstandingAmount: 70000,
  paidAmount: 30000,        // Advance paid
  paymentStatus: 'partial'
})

// 3. Allocate credit (only ₹70k)
allocateOrderCredit(userId, orderId, 70000)

// 4. On delivery, buyer pays ₹70k
recordOrderPayment(userId, orderId, 70000)
// → Outstanding: ₹0
// → paymentStatus: 'paid'
```

## ⚠️ Common Issues

### Issue: Insufficient Credit
**Error**: "Insufficient credit. Available: ₹X, Required: ₹Y"
**Fix**: Admin increases credit limit or buyer pays outstanding

### Issue: Payment Not Applied
**Symptom**: Payment recorded but outstanding not reduced
**Fix**: Check userId and orderId match; verify order has creditUsed > 0

### Issue: Can't Place Order
**Error**: "Credit status: suspended"
**Fix**: Admin reviews and reactivates credit (resolve overdue payments first)

## 🧪 Testing Checklist

- [ ] Apply for credit as buyer
- [ ] Admin approves with specific limit
- [ ] Check credit availability before order
- [ ] Create order with Net 30 terms
- [ ] Verify credit allocated (available decreases)
- [ ] Record payment, verify credit released
- [ ] Try order exceeding credit limit (should fail)
- [ ] Simulate overdue (past due date)
- [ ] Run mark-overdue cron
- [ ] Admin suspends credit
- [ ] Verify suspended buyer cannot place orders

## 🔐 Security Notes

- Only approved buyers can use credit
- Admin-only endpoints require authentication
- All credit operations logged to audit trail
- Atomic updates prevent race conditions
- Risk-based limits reduce fraud exposure

## 📞 Support

**Common Questions**:
- Q: How long does approval take?
  A: 2-3 business days (manual review)

- Q: Can I request a credit increase?
  A: Yes, contact admin with updated business data

- Q: What happens if I miss payment?
  A: Order marked overdue; credit may be suspended

**Admin Contact**: credit@nearbybazaar.com

---

**Quick Links**:
- [Full Documentation](./PAYMENT_TERMS.md)
- [B2B Buyer Accounts](./B2B_BUYER_ACCOUNTS.md)
- [GST Invoicing](./GST_INVOICING.md)

**Last Updated**: 2025-10-20
