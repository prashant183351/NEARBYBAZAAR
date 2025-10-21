# Vendor Suspension & Escalation Engine

## Overview

The Vendor Suspension & Escalation Engine is an automated system that monitors vendor performance metrics and takes appropriate enforcement actions when vendors fail to meet platform standards. The system provides a graduated escalation path with admin oversight capabilities.

## Table of Contents

1. [Key Features](#key-features)
2. [Escalation Rules](#escalation-rules)
3. [Action Types](#action-types)
4. [Architecture](#architecture)
5. [API Endpoints](#api-endpoints)
6. [Admin Interface](#admin-interface)
7. [Vendor Interface](#vendor-interface)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Key Features

- **Automated Monitoring**: Background jobs continuously evaluate vendor performance metrics
- **Graduated Escalation**: Warning → Temporary Suspension → Permanent Block
- **Configurable Thresholds**: Easily adjustable rules for each metric and action level
- **Admin Override**: Admins can manually override any automated action with reasoning
- **Audit Trail**: All actions are logged with full context (metrics snapshot, trigger reason, etc.)
- **Auto-Expiration**: Temporary suspensions automatically expire after 30 days
- **Order Guards**: Suspended/blocked vendors cannot accept new orders
- **Email Notifications**: Vendors and admins receive notifications for all actions (TODO)

## Escalation Rules

### Default Thresholds

| Metric | Warning | Temp Suspension | Permanent Block |
|--------|---------|-----------------|-----------------|
| **Order Defect Rate (ODR)** | > 1% | > 2% | > 4% |
| **Late Shipment Rate** | > 5% | > 10% | > 15% |
| **Cancellation Rate** | > 3% | > 6% | > 10% |

### Metric Definitions

- **Order Defect Rate (ODR)**: Percentage of orders with disputes or refunds
- **Late Shipment Rate**: Percentage of orders shipped after expected dispatch date
- **Cancellation Rate**: Percentage of orders cancelled by vendor

### Evaluation Period

Metrics are calculated over a rolling 30-day window.

## Action Types

### 1. Warning

- **Trigger**: Any metric exceeds warning threshold
- **Effect**: Vendor is notified, no order restrictions
- **Duration**: Remains until metrics improve or escalates
- **Purpose**: Early intervention to encourage improvement

### 2. Temporary Suspension

- **Trigger**: Any metric exceeds temp suspension threshold
- **Effect**: 
  - Vendor cannot accept new orders
  - Status set to `suspended`
  - Existing orders must be fulfilled
- **Duration**: 30 days (auto-expires)
- **Purpose**: Give vendor time to improve operations

### 3. Permanent Block

- **Trigger**: Any metric exceeds permanent block threshold
- **Effect**:
  - Vendor permanently blocked from accepting orders
  - Status set to `blocked`
  - Requires admin override to restore
- **Duration**: Permanent until admin override
- **Purpose**: Remove consistently underperforming vendors

## Architecture

### Data Model

**VendorAction Schema**:
```typescript
{
  vendor: ObjectId,           // Reference to Vendor
  actionType: enum,           // 'warning' | 'temp_suspend' | 'permanent_block'
  reason: string,             // Human-readable explanation
  status: enum,               // 'pending' | 'active' | 'overridden' | 'expired'
  triggeredBy: enum,          // 'system' | 'admin'
  triggeredByUser: ObjectId,  // Admin user if manual
  metrics: {                  // Snapshot of metrics at time of action
    orderDefectRate: number,
    lateShipmentRate: number,
    cancellationRate: number,
    totalOrders: number,
    defectCount: number,
    lateCount: number,
    cancelCount: number
  },
  expiresAt: Date,            // For temp_suspend only
  overriddenBy: ObjectId,     // Admin who overrode
  overriddenAt: Date,
  overrideReason: string
}
```

### Services

**`apps/api/src/services/vendorEscalation.ts`**:
- `evaluateEscalation()`: Evaluate metrics against rules
- `createVendorAction()`: Create and apply enforcement action
- `overrideVendorAction()`: Admin override with reasoning
- `canVendorAcceptOrders()`: Check if vendor can receive orders
- `expireSuspensions()`: Auto-expire temporary suspensions
- `getEscalationHistory()`: Retrieve action history and stats

### Background Jobs

**`apps/api/src/jobs/checkVendorReputation.ts`**:
- Runs periodically (e.g., every hour)
- Expires temporary suspensions first
- Evaluates all active vendors
- Creates actions as needed
- Prevents duplicate actions
- Logs all decisions

## API Endpoints

### Vendor Endpoints

```
GET /v1/vendor-actions/my-actions
```
Get active actions for authenticated vendor.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "actionType": "warning",
      "reason": "Order Defect Rate (1.5%) exceeds warning threshold (1%)",
      "status": "active",
      "metrics": { ... },
      "createdAt": "2025-01-20T10:00:00Z"
    }
  ]
}
```

---

```
GET /v1/vendor-actions/can-accept-orders
```
Check if vendor can accept new orders.

**Response**:
```json
{
  "success": true,
  "data": {
    "canAccept": false,
    "reason": "Vendor is temporarily suspended",
    "action": { ... }
  }
}
```

### Admin Endpoints

```
GET /v1/vendor-actions/pending
```
Get all vendors requiring action.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "vendorId": "...",
      "vendorName": "Example Store",
      "status": "active",
      "metrics": { ... },
      "recommendedAction": "warning",
      "reason": "..."
    }
  ]
}
```

---

```
GET /v1/vendor-actions/vendor/:vendorId/history
```
Get full escalation history for a vendor.

**Response**:
```json
{
  "success": true,
  "data": {
    "vendor": "...",
    "actions": [ ... ],
    "stats": {
      "totalActions": 5,
      "activeActions": 1,
      "warnings": 3,
      "tempSuspensions": 1,
      "permanentBlocks": 0,
      "overrides": 1
    }
  }
}
```

---

```
POST /v1/vendor-actions/action/:actionId/override
```
Override an active action (admin only).

**Request**:
```json
{
  "overrideReason": "Vendor has improved operations and resolved outstanding issues. Manual review confirmed compliance."
}
```

**Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Action overridden successfully. Vendor has been restored to active status."
}
```

---

```
POST /v1/vendor-actions/vendor/:vendorId/action
```
Manually create a vendor action (admin only).

**Request**:
```json
{
  "actionType": "temp_suspend",
  "reason": "Multiple customer complaints about product quality"
}
```

---

```
GET /v1/vendor-actions/rules
```
Get current escalation rules.

**Response**:
```json
{
  "success": true,
  "data": {
    "rules": {
      "orderDefectRate": { ... },
      "lateShipmentRate": { ... },
      "cancellationRate": { ... }
    }
  }
}
```

## Admin Interface

**Location**: `apps/admin/pages/vendors/actions.tsx`

### Features

1. **Vendors Requiring Action Table**:
   - Lists vendors with metrics exceeding thresholds
   - Shows current status and recommended action
   - Real-time refresh capability

2. **Vendor Action History**:
   - Detailed timeline of all actions for a vendor
   - Statistics summary (total actions, active, warnings, etc.)
   - Status indicators with color coding

3. **Override Functionality**:
   - Modal interface for overriding active actions
   - Requires detailed reasoning (min 10 characters)
   - Instant feedback on success/failure

### Usage

1. Navigate to Admin → Vendors → Actions
2. Review vendors requiring action
3. Click "View History" for detailed vendor information
4. Click "Override Action" for active actions needing manual review
5. Provide reasoning and confirm

## Vendor Interface

**Location**: `apps/vendor/pages/account/actions.tsx`

### Features

1. **Account Status Banner**:
   - Clear indication of order acceptance capability
   - Visual differentiation (green = active, red = restricted)

2. **Active Actions Display**:
   - Large, prominent cards for each active action
   - Icon-based visual indicators
   - Performance metrics snapshot
   - Action-specific guidance

3. **Historical Actions**:
   - Collapsed list of past actions
   - Status indicators (overridden, expired)

### Guidance Provided

- **Warning**: Steps to improve metrics
- **Temp Suspension**: Requirements for restoration
- **Permanent Block**: Appeal process information

## Testing

### Unit Tests

Test the escalation service functions:

```bash
npm test apps/api/src/services/vendorEscalation.test.ts
```

Key test scenarios:
- ✅ Evaluate escalation with different metric combinations
- ✅ Create actions and update vendor status
- ✅ Admin override restores vendor status
- ✅ canVendorAcceptOrders returns correct values
- ✅ expireSuspensions handles date logic
- ✅ Duplicate action prevention

### Integration Tests

Test the background job:

```bash
npm test apps/api/tests/jobs/checkVendorReputation.spec.ts
```

Test API endpoints:

```bash
npm test apps/api/tests/routes/vendorActions.spec.ts
```

### Manual Testing

1. **Create test vendor with poor metrics**:
   ```javascript
   // In MongoDB shell or seed script
   db.orders.insertMany([
     { vendor: vendorId, status: 'refunded', hasDispute: true, ... },
     { vendor: vendorId, status: 'cancelled', cancelledBy: 'vendor', ... }
     // Add enough to trigger thresholds
   ]);
   ```

2. **Trigger background job**:
   ```bash
   # Via API or cron
   curl -X POST http://localhost:4000/admin/jobs/check-vendor-reputation
   ```

3. **Verify action created**:
   ```bash
   curl http://localhost:4000/v1/vendor-actions/vendor/{vendorId}/history
   ```

4. **Test admin override**:
   - Login as admin
   - Navigate to Admin → Vendors → Actions
   - Override the action with reasoning

5. **Test vendor view**:
   - Login as affected vendor
   - Navigate to Account → Actions
   - Verify action is displayed with guidance

## Troubleshooting

### Issue: Actions not being created

**Possible Causes**:
- Background job not running
- Metrics not calculated correctly
- Thresholds too high
- Duplicate action prevention triggered

**Solutions**:
1. Check job logs for errors
2. Verify reputation metrics service is working
3. Review ESCALATION_RULES configuration
4. Check for existing active actions

### Issue: Vendor still able to accept orders despite suspension

**Possible Causes**:
- Order guard middleware not applied
- Vendor status not updated
- Cache not invalidated

**Solutions**:
1. Verify vendor status in database: `db.vendors.findOne({ _id: vendorId })`
2. Check order creation endpoint has `canVendorAcceptOrders` guard
3. Clear any caches (Redis, etc.)

### Issue: Temporary suspension not expiring

**Possible Causes**:
- Background job not running expiration logic
- expiresAt date incorrect
- Status not updated

**Solutions**:
1. Manually trigger expiration: call `expireSuspensions()` service
2. Check expiresAt field: `db.vendorActions.find({ status: 'active', expiresAt: { $lt: new Date() } })`
3. Review job logs for expiration attempts

### Issue: Admin override not working

**Possible Causes**:
- Authorization middleware blocking request
- Action ID incorrect
- Override reason too short

**Solutions**:
1. Verify admin role: `req.user.role === 'admin'`
2. Check action exists and is active
3. Ensure override reason meets minimum length (10 chars)

## Configuration

### Updating Escalation Rules

Edit `apps/api/src/services/vendorEscalation.ts`:

```typescript
export const ESCALATION_RULES: EscalationRules = {
  orderDefectRate: {
    warning: 0.01,      // 1%
    tempSuspend: 0.02,  // 2%
    permanentBlock: 0.04 // 4%
  },
  // Adjust thresholds as needed
};
```

### Changing Suspension Duration

Modify the expiration calculation in `createVendorAction()`:

```typescript
if (actionType === 'temp_suspend') {
  // Default: 30 days
  // Change to 45 days:
  action.expiresAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
}
```

### Adjusting Job Frequency

Update the job schedule in your task scheduler:

```typescript
// Example with BullMQ
queue.add('check-vendor-reputation', {}, {
  repeat: {
    cron: '0 * * * *' // Every hour (default)
    // cron: '0 */2 * * *' // Every 2 hours
    // cron: '0 0 * * *'  // Daily at midnight
  }
});
```

## Email Notifications (TODO)

Future implementation will include:

1. **Vendor Notifications**:
   - Email sent when action created
   - Include current metrics and improvement steps
   - Link to account actions page

2. **Admin Notifications**:
   - Daily digest of new actions
   - Alerts for permanent blocks requiring review

3. **Escalation Reminders**:
   - Warning vendors approaching suspension
   - Remind suspended vendors of expiration date

Template locations (to be created):
- `apps/api/src/templates/emails/vendor-warning.html`
- `apps/api/src/templates/emails/vendor-suspension.html`
- `apps/api/src/templates/emails/vendor-block.html`

## Best Practices

1. **Regular Monitoring**: Review the admin dashboard daily
2. **Investigate Before Override**: Always verify metrics and order history before overriding
3. **Document Override Reasons**: Provide detailed, specific reasons for all overrides
4. **Communicate with Vendors**: Consider reaching out to vendors before permanent blocks
5. **Review Thresholds Quarterly**: Adjust rules based on platform-wide performance trends
6. **Test Thoroughly**: Always test rule changes with historical data before deploying

## Related Documentation

- [Reputation Metrics](./REPUTATION_METRICS.md) - Metric calculation details
- [Vendor Management](./VENDOR_MANAGEMENT.md) - Overall vendor lifecycle
- [Background Jobs](./BACKGROUND_JOBS.md) - Job scheduling and monitoring
- [Admin Dashboard](./ADMIN_DASHBOARD.md) - Admin interface guide

## Support

For issues or questions:
- **Technical Issues**: Create a ticket in the engineering system
- **Policy Questions**: Contact the marketplace policy team
- **Vendor Appeals**: Forward to vendor-support@nearbybazaar.com
