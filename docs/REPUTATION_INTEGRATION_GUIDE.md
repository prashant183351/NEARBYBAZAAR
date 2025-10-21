# Reputation Metrics Integration Guide

## For Backend Developers

### Step 1: Order Processing Integration
When creating or updating orders, ensure reputation fields are populated:

```typescript
import { Order } from './models/Order';

// When order is created
const order = new Order({
  user: buyerId,
  vendor: vendorId,  // ⚠️ REQUIRED for reputation tracking
  status: 'pending',
  expectedDispatchDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
  // ... other fields
});

// When order is shipped
order.status = 'shipped';
order.shippedAt = new Date();  // ⚠️ REQUIRED for late shipment tracking
await order.save();

// When order is cancelled by vendor
order.status = 'cancelled';
order.cancelledBy = 'vendor';  // ⚠️ REQUIRED for cancellation rate
order.cancellationReason = 'out_of_stock';
await order.save();

// When dispute is raised
order.hasDispute = true;  // ⚠️ REQUIRED for ODR calculation
await order.save();
```

### Step 2: Import Reputation Service
```typescript
import { 
  getVendorReputationMetrics, 
  evaluateVendorStanding 
} from './services/reputationMetrics';

// Get metrics for a vendor
const metrics = await getVendorReputationMetrics(vendorId, 30);
console.log(metrics.status); // 'excellent' | 'good' | 'needs_improvement' | 'critical'

// Evaluate if action needed
const evaluation = await evaluateVendorStanding(vendorId);
if (evaluation.action === 'suspend') {
  // Handle suspension
}
```

### Step 3: Schedule Background Job
```typescript
// Using BullMQ
import { Queue } from 'bullmq';
import { checkVendorReputations } from './jobs/checkVendorReputation';

const queue = new Queue('reputation');

queue.add('daily-check', {}, {
  repeat: { cron: '0 2 * * *' }  // 2 AM daily
});

queue.process('daily-check', async () => {
  await checkVendorReputations();
});
```

---

## For Frontend Developers

### Step 1: Add Route to Vendor App
```typescript
// apps/vendor/pages/dashboard/reputation.tsx already exists
// Add link in navigation:

<Link href="/dashboard/reputation">
  Performance Scorecard
</Link>
```

### Step 2: Fetch Metrics in Component
```typescript
import axios from 'axios';
import { useEffect, useState } from 'react';

const [metrics, setMetrics] = useState(null);
const [period, setPeriod] = useState(30);

useEffect(() => {
  axios.get(`/api/reputation/vendor?days=${period}`)
    .then(res => setMetrics(res.data.data))
    .catch(console.error);
}, [period]);

// Display metrics
{metrics && (
  <div>
    <h2>Status: {metrics.status}</h2>
    <p>ODR: {metrics.orderDefectRate}%</p>
    <p>Late: {metrics.lateShipmentRate}%</p>
    <p>Cancel: {metrics.cancellationRate}%</p>
  </div>
)}
```

### Step 3: Add Status Badge Component
```typescript
const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    excellent: '#10b981',
    good: '#3b82f6',
    needs_improvement: '#f59e0b',
    critical: '#ef4444'
  };
  
  return (
    <span style={{ 
      backgroundColor: colors[status], 
      color: 'white',
      padding: '4px 12px',
      borderRadius: '4px',
      fontWeight: 'bold'
    }}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};
```

---

## For Database Admins

### Required Indexes
```javascript
// MongoDB indexes for performance
db.orders.createIndex({ vendor: 1, createdAt: -1 });
db.orders.createIndex({ vendor: 1, status: 1 });
db.orders.createIndex({ vendor: 1, hasDispute: 1 });
db.orders.createIndex({ shippedAt: 1, expectedDispatchDate: 1 });
```

### Data Migration (if needed)
```javascript
// If you have existing orders without vendor field
db.orders.updateMany(
  { vendor: { $exists: false } },
  { $set: { vendor: null } }
);

// Set default values for new fields
db.orders.updateMany(
  { hasDispute: { $exists: false } },
  { $set: { hasDispute: false } }
);
```

---

## For DevOps Engineers

### Environment Variables
```bash
# .env
ADMIN_EMAIL=admin@nearbybazaar.com  # For critical alerts
LOG_LEVEL=info                      # Logging level
```

### Monitoring & Alerts
```yaml
# alerts.yml
- name: HighCriticalVendorRate
  condition: critical_vendors_count > 10
  action: notify_slack
  channel: '#marketplace-alerts'

- name: ReputationJobFailed
  condition: job_status == 'failed'
  action: notify_pagerduty
  severity: high
```

### Health Checks
```bash
# Check reputation API
curl -X GET http://localhost:3000/v1/reputation/vendor?days=30 \
  -H "Authorization: Bearer $VENDOR_TOKEN"

# Verify background job
curl -X POST http://localhost:3000/admin/jobs/trigger \
  -d '{"job": "check-vendor-reputation"}' \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## For QA Engineers

### Test Scenarios

#### Scenario 1: Excellent Vendor
```
Given vendor has 100 orders in last 30 days
  And 0 refunds, 0 returns, 0 disputes
  And 0 late shipments
  And 0 vendor cancellations
When I fetch reputation metrics
Then status should be "excellent"
  And orderDefectRate should be 0
  And lateShipmentRate should be 0
  And cancellationRate should be 0
```

#### Scenario 2: Critical Vendor
```
Given vendor has 100 orders in last 30 days
  And 5 refunds, 2 returns, 1 dispute (8 defects)
  And 12 late shipments out of 92 shipped
  And 8 vendor cancellations
When I fetch reputation metrics
Then status should be "critical"
  And orderDefectRate should be 8%
  And lateShipmentRate should be ~13%
  And cancellationRate should be 8%
```

### Automated Test Suite
```typescript
describe('Reputation Metrics', () => {
  it('should calculate ODR correctly', async () => {
    // Create test orders
    // Calculate metrics
    // Assert values
  });

  it('should trigger warning email', async () => {
    // Set vendor to warning status
    // Run background job
    // Verify email sent
  });

  it('should handle edge cases', async () => {
    // Test with 0 orders
    // Test with all cancelled orders
    // Test with null dates
  });
});
```

---

## Common Integration Patterns

### Pattern 1: Real-time Status Check
```typescript
// Before allowing vendor action
const evaluation = await evaluateVendorStanding(vendorId);
if (evaluation.action === 'suspend') {
  throw new Error('Account under review. Contact support.');
}
// Proceed with action
```

### Pattern 2: Dashboard Widget
```typescript
// Show mini reputation widget on vendor dashboard
<ReputationWidget vendorId={vendorId} compact={true} />
```

### Pattern 3: Admin Alert System
```typescript
// Daily digest of critical vendors
const criticalVendors = await getAllVendorsReputationMetrics(30);
const critical = criticalVendors.vendors.filter(v => v.status === 'critical');
await sendAdminDigest(critical);
```

---

## Rollback Plan

If issues arise after deployment:

### Step 1: Disable Background Job
```typescript
// Comment out or disable job
// scheduler.remove('reputation-check');
```

### Step 2: Disable API Endpoints
```typescript
// In routes/index.ts
// router.use('/reputation', reputationRouter);  // Comment out
```

### Step 3: Hide UI Components
```typescript
// In vendor navigation
// Remove link to /dashboard/reputation
```

### Step 4: Database Rollback (if needed)
```javascript
// Remove added fields
db.orders.updateMany({}, { 
  $unset: { 
    hasDispute: "", 
    shippedAt: "",
    expectedDispatchDate: "",
    cancelledBy: "",
    cancellationReason: ""
  }
});
```

---

## Performance Considerations

### Query Optimization
- Use indexes on vendor + createdAt for fast filtering
- Cache metrics for 5-10 minutes to reduce DB load
- Use aggregation pipeline for admin dashboard

### Scalability
- Current implementation handles up to ~1000 vendors
- For larger scale, consider:
  - Pre-computed metrics stored in cache
  - Materialized views for admin dashboard
  - Background worker pool for metric calculation

### Load Testing
```bash
# Simulate 100 concurrent vendor requests
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
   http://localhost:3000/v1/reputation/vendor?days=30
```

---

## Checklist for Go-Live

- [ ] Order model updated with reputation fields
- [ ] API routes integrated and tested
- [ ] Vendor dashboard accessible
- [ ] Admin dashboard accessible
- [ ] Background job scheduled
- [ ] Email templates configured (if applicable)
- [ ] Monitoring alerts set up
- [ ] Documentation reviewed with team
- [ ] QA sign-off received
- [ ] Rollback plan tested
- [ ] Performance testing completed
- [ ] Security review completed

---

**Last Updated**: October 20, 2025
**Version**: 1.0.0
**Status**: Ready for Production
