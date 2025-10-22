# Vendor Escalation System - Quick Reference

## Quick Stats

- **Default Thresholds**: ODR 1%/2%/4%, Late 5%/10%/15%, Cancel 3%/6%/10%
- **Suspension Duration**: 30 days (auto-expires)
- **Evaluation Period**: Rolling 30 days
- **Action Types**: Warning, Temp Suspension, Permanent Block

## Common Commands

### Check Vendor Actions

```bash
# Get vendor's action history
curl http://localhost:4000/v1/vendor-actions/vendor/{vendorId}/history

# Check if vendor can accept orders
curl http://localhost:4000/v1/vendor-actions/can-accept-orders
```

### Admin Operations

```bash
# Get vendors requiring action
curl http://localhost:4000/v1/vendor-actions/pending

# Override an action
curl -X POST http://localhost:4000/v1/vendor-actions/action/{actionId}/override \
  -H "Content-Type: application/json" \
  -d '{"overrideReason": "Detailed reason here"}'

# Manually create action
curl -X POST http://localhost:4000/v1/vendor-actions/vendor/{vendorId}/action \
  -H "Content-Type: application/json" \
  -d '{"actionType": "warning", "reason": "Manual review indicated issues"}'
```

### Database Queries

```javascript
// Find all active actions
db.vendorActions.find({ status: 'active' });

// Find suspended vendors
db.vendors.find({ status: 'suspended' });

// Find expired suspensions that need cleanup
db.vendorActions.find({
  status: 'active',
  actionType: 'temp_suspend',
  expiresAt: { $lt: new Date() },
});

// Get vendor's action count
db.vendorActions.countDocuments({ vendor: ObjectId('...') });
```

## Action Flow

```
Metrics Calculated
       ↓
Rules Evaluated
       ↓
Action Recommended? ──No──→ Continue Monitoring
       ↓ Yes
Create Action
       ↓
Update Vendor Status
       ↓
Log to Audit Trail
       ↓
Notify Vendor & Admin (TODO)
```

## Override Process

1. Admin reviews vendor history
2. Clicks "Override Action"
3. Provides detailed reason (min 10 chars)
4. System:
   - Marks action as 'overridden'
   - Restores vendor status to 'active'
   - Logs override with admin ID and timestamp
5. Vendor can accept orders again

## Expiration Process

1. Background job runs (hourly)
2. Calls `expireSuspensions()`
3. Finds active temp_suspend actions with expiresAt < now
4. Updates action status to 'expired'
5. Restores vendor status to 'active'
6. Logs expiration

## File Locations

| Component          | Path                                             |
| ------------------ | ------------------------------------------------ |
| VendorAction Model | `apps/api/src/models/VendorAction.ts`            |
| Escalation Service | `apps/api/src/services/vendorEscalation.ts`      |
| Background Job     | `apps/api/src/jobs/checkVendorReputation.ts`     |
| API Controller     | `apps/api/src/controllers/metrics/escalation.ts` |
| API Routes         | `apps/api/src/routes/vendorActions.ts`           |
| Admin UI           | `apps/admin/pages/vendors/actions.tsx`           |
| Vendor UI          | `apps/vendor/pages/account/actions.tsx`          |
| Documentation      | `docs/VENDOR_ESCALATION.md`                      |

## Key Functions

### Service Functions

- `evaluateEscalation(metrics)` - Returns recommended action
- `createVendorAction(vendorId, type, reason, metrics)` - Creates and applies action
- `overrideVendorAction(actionId, adminId, reason)` - Admin override
- `canVendorAcceptOrders(vendorId)` - Check order eligibility
- `expireSuspensions()` - Auto-expire temp suspensions
- `getEscalationHistory(vendorId)` - Get full history

### Controller Functions

- `getMyActions` - Vendor's active actions
- `checkOrderAcceptance` - Can vendor accept orders?
- `getVendorsPendingAction` - Admin: vendors needing action
- `adminOverrideAction` - Admin: override action
- `adminCreateAction` - Admin: manual action
- `getEscalationRules` - Get current rules

## Status Reference

### VendorAction Status

- `pending` - Created but not yet applied
- `active` - Currently in effect
- `overridden` - Admin manually reversed
- `expired` - Temporary suspension time elapsed

### Vendor Status

- `active` - Can accept orders
- `suspended` - Temporarily restricted
- `blocked` - Permanently restricted

## Testing Checklist

- [ ] Create test vendor with poor metrics
- [ ] Trigger background job
- [ ] Verify action created in database
- [ ] Test order guard prevents new orders
- [ ] Test admin override restores status
- [ ] Test temporary suspension expires after 30 days
- [ ] Verify duplicate actions prevented
- [ ] Check vendor UI displays actions correctly
- [ ] Check admin UI shows pending vendors
- [ ] Verify audit logs contain all changes

## Monitoring

### Metrics to Track

- Actions created per day
- Warning → Suspension escalation rate
- Override frequency
- Average time to resolution
- Vendor improvement rate after warning

### Alerts to Set Up

- Spike in permanent blocks (potential platform issue)
- High override rate (rules may need adjustment)
- Expired suspensions not processed (job failure)

## Troubleshooting Quick Fixes

### Action not created

```javascript
// Manually trigger evaluation
const metrics = await getVendorReputationMetrics(vendorId, 30);
const action = await createVendorAction(vendorId, 'warning', 'Manual check', metrics);
```

### Suspension not expiring

```javascript
// Manually expire suspensions
await expireSuspensions();
```

### Vendor status stuck

```javascript
// Manually reset vendor status
await Vendor.findByIdAndUpdate(vendorId, { status: 'active' });
```

### Clear all actions for testing

```javascript
// WARNING: Use only in development
await VendorAction.deleteMany({ vendor: vendorId });
await Vendor.findByIdAndUpdate(vendorId, { status: 'active' });
```

## Configuration Quick Edit

Edit `apps/api/src/services/vendorEscalation.ts`:

```typescript
export const ESCALATION_RULES: EscalationRules = {
  orderDefectRate: {
    warning: 0.01, // Adjust these values
    tempSuspend: 0.02,
    permanentBlock: 0.04,
  },
  lateShipmentRate: {
    warning: 0.05,
    tempSuspend: 0.1,
    permanentBlock: 0.15,
  },
  cancellationRate: {
    warning: 0.03,
    tempSuspend: 0.06,
    permanentBlock: 0.1,
  },
};
```

## API Response Examples

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Integration Points

### Order Creation

```typescript
// Add this guard to order creation endpoint
const eligibility = await canVendorAcceptOrders(vendorId);
if (!eligibility.canAccept) {
  return res.status(403).json({
    success: false,
    error: eligibility.reason,
  });
}
```

### Vendor Dashboard

```typescript
// Show banner if vendor has active actions
const actions = await getVendorActions(vendorId, false);
if (actions.length > 0) {
  // Display warning banner
}
```

### Admin Dashboard

```typescript
// Show count of vendors needing review
const vendors = await getVendorsRequiringAction();
const needsAction = vendors.length;
```

## Support Contacts

- **Engineering**: Create ticket with tag `vendor-escalation`
- **Policy Team**: escalation-policy@nearbybazaar.com
- **Vendor Support**: vendor-support@nearbybazaar.com

---

**Last Updated**: Feature #265 Implementation
**Version**: 1.0
**Maintainer**: Platform Engineering Team
