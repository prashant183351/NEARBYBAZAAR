# Reputation Metrics Quick Reference

## For Vendors

### Check Your Scorecard

```bash
GET /v1/reputation/vendor?days=30
```

### Status Meanings

- 🟢 **Excellent** (< 0.5% ODR, < 2% Late, < 1% Cancel)
- 🔵 **Good** (< 1% ODR, < 4% Late, < 2.5% Cancel)
- 🟠 **Needs Improvement** (< 2% ODR, < 7% Late, < 5% Cancel)
- 🔴 **Critical** (≥ 3% ODR, ≥ 10% Late, ≥ 7.5% Cancel)

### Quick Wins

1. Ship on time (updates expected dispatch date automatically)
2. Keep inventory accurate (reduces cancellations)
3. Respond to disputes quickly (lowers ODR)

---

## For Admins

### View All Vendors

```bash
GET /v1/reputation/admin?days=30
```

### Evaluate Specific Vendor

```bash
GET /v1/reputation/evaluate/{vendorId}
```

### Actions by Status

- **Critical**: Review for suspension, send urgent email
- **Needs Improvement**: Send warning, monitor next period
- **Good/Excellent**: No action needed

---

## Metric Formulas

```typescript
ODR = ((refunds + returns + disputes) / total_orders) * 100;
Late = (late_shipments / total_shipments) * 100;
Cancel = (vendor_cancels / total_orders) * 100;
```

---

## Integration Points

### Order Model Fields

```typescript
vendor: ObjectId;
hasDispute: boolean;
shippedAt: Date;
expectedDispatchDate: Date;
cancelledBy: 'buyer' | 'vendor' | 'admin' | 'system';
cancellationReason: string;
status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'refunded' | 'returned' | 'cancelled';
```

### Background Job

```typescript
// apps/api/src/jobs/checkVendorReputation.ts
import { checkVendorReputations } from './jobs/checkVendorReputation';

// Schedule daily checks
checkVendorReputations(); // Returns summary
```

---

## Dashboard URLs

- **Vendor**: `/dashboard/reputation`
- **Admin**: `/admin/dashboard/reputation`

---

## Testing Checklist

- [ ] Create order with dispute → ODR increases
- [ ] Ship order late → Late rate increases
- [ ] Cancel order as vendor → Cancel rate increases
- [ ] Verify status changes at thresholds
- [ ] Check warning emails sent
- [ ] Validate dashboard rendering
