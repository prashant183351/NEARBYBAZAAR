# Marketplace Reputation Metrics

## Overview

The NearbyBazaar marketplace reputation system tracks key seller performance metrics to maintain marketplace quality and buyer trust. This system automatically calculates, monitors, and acts upon vendor performance indicators.

## Key Metrics

### 1. Order Defect Rate (ODR)

**Definition**: Percentage of orders with serious issues (refunds, returns, or disputes)

**Formula**: `(Refunded Orders + Returned Orders + Orders with Disputes) / Total Orders × 100`

**Thresholds**:

- **Excellent**: < 0.5%
- **Good**: 0.5% - 1%
- **Warning**: 1% - 2%
- **Critical**: ≥ 3%

### 2. Late Shipment Rate

**Definition**: Percentage of orders shipped after the expected dispatch date

**Formula**: `Late Shipments / Total Shipped Orders × 100`

**Thresholds**:

- **Excellent**: < 2%
- **Good**: 2% - 4%
- **Warning**: 4% - 7%
- **Critical**: ≥ 10%

### 3. Cancellation Rate

**Definition**: Percentage of vendor-initiated cancellations or out-of-stock cancellations

**Formula**: `Vendor Cancellations / Total Orders × 100`

**Thresholds**:

- **Excellent**: < 1%
- **Good**: 1% - 2.5%
- **Warning**: 2.5% - 5%
- **Critical**: ≥ 7.5%

## Status Levels

### Excellent

All metrics are in the excellent range. Vendor receives priority placement and potential promotional benefits.

### Good

Metrics are acceptable but have room for improvement. No restrictions applied.

### Needs Improvement

One or more metrics exceed warning thresholds. Vendor receives:

- Automated warning email
- Dashboard notification
- Performance improvement recommendations

### Critical

One or more metrics exceed critical thresholds. Vendor faces:

- Immediate notification
- Admin review for potential suspension
- Temporary listing restrictions (potential)
- Required improvement plan

## API Endpoints

### Vendor Endpoints

#### Get Own Reputation Metrics

```http
GET /v1/reputation/vendor?days=30
Authorization: Bearer {vendor_token}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "orderDefectRate": 0.8,
    "lateShipmentRate": 3.2,
    "cancellationRate": 1.5,
    "totalOrders": 250,
    "period": "30 days",
    "status": "good"
  }
}
```

### Admin Endpoints

#### Get All Vendors Reputation

```http
GET /v1/reputation/admin?days=30
Authorization: Bearer {admin_token}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "vendors": [
      {
        "vendorId": "...",
        "vendorName": "Example Store",
        "vendorEmail": "vendor@example.com",
        "orderDefectRate": 2.1,
        "lateShipmentRate": 5.0,
        "cancellationRate": 3.0,
        "totalOrders": 150,
        "status": "needs_improvement"
      }
    ],
    "summary": {
      "total": 100,
      "critical": 5,
      "needsImprovement": 15,
      "good": 50,
      "excellent": 30
    },
    "thresholds": {
      "odr": { "excellent": 0.5, "good": 1, "warning": 2, "critical": 3 },
      "lateShipment": { "excellent": 2, "good": 4, "warning": 7, "critical": 10 },
      "cancellation": { "excellent": 1, "good": 2.5, "warning": 5, "critical": 7.5 }
    }
  }
}
```

#### Evaluate Vendor Standing

```http
GET /v1/reputation/evaluate/{vendorId}
Authorization: Bearer {admin_token}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "action": "warning",
    "reason": "ODR 2.1% exceeds 2%; Cancellation 3.0% exceeds 2.5%",
    "metrics": {
      "orderDefectRate": 2.1,
      "lateShipmentRate": 5.0,
      "cancellationRate": 3.0,
      "totalOrders": 150,
      "period": "30 days",
      "status": "needs_improvement"
    }
  }
}
```

## Vendor Dashboard

Vendors can view their performance scorecard at:

```
/dashboard/reputation
```

**Features**:

- Real-time metric calculations
- Visual status indicators (color-coded cards)
- Period selection (7, 30, 90 days)
- Threshold explanations
- Actionable improvement tips

## Admin Dashboard

Admins can monitor all vendors at:

```
/admin/dashboard/reputation
```

**Features**:

- Summary statistics (critical, needs improvement, good, excellent counts)
- Sortable vendor table
- Status filtering (click on summary cards to filter)
- Quick action buttons for problematic vendors
- Export capabilities (future enhancement)

## Automated Monitoring

### Scheduled Job

A background job runs periodically to check all active vendors' reputation:

**File**: `apps/api/src/jobs/checkVendorReputation.ts`

**Actions**:

1. Calculate metrics for all active vendors
2. Evaluate each vendor's standing
3. Send warning emails for "needs improvement" status
4. Send critical alerts for "critical" status
5. Notify admins of vendors flagged for suspension

**Integration**: Add to cron scheduler or BullMQ repeatable jobs:

```typescript
import { checkVendorReputations } from './jobs/checkVendorReputation';

// Run daily at 2 AM
queue.add(
  'check-vendor-reputation',
  {},
  {
    repeat: { cron: '0 2 * * *' },
  },
);
```

## Database Schema Updates

### Order Model Extensions

```typescript
{
  vendor: ObjectId,  // Reference to vendor
  hasDispute: Boolean,  // Flag for disputes
  shippedAt: Date,  // Actual ship timestamp
  expectedDispatchDate: Date,  // Expected dispatch
  cancelledBy: String,  // 'buyer' | 'vendor' | 'admin' | 'system'
  cancellationReason: String,  // Reason for cancellation
  status: String  // Added: 'shipped', 'delivered', 'refunded', 'returned'
}
```

## Best Practices for Vendors

### Improving ODR

- Accurate product descriptions
- Quality control checks
- Proactive customer communication
- Quick dispute resolution

### Improving Late Shipment Rate

- Realistic dispatch time commitments
- Automated order processing
- Buffer time for high-volume periods
- Carrier reliability monitoring

### Improving Cancellation Rate

- Real-time inventory synchronization
- Conservative stock availability
- Automated stock alerts
- Quick restocking processes

## Future Enhancements

1. **Predictive Analytics**: ML models to predict vendors at risk
2. **Performance Coaching**: Automated improvement recommendations
3. **Peer Benchmarking**: Compare metrics with similar vendors
4. **Customer Feedback Integration**: Tie review scores to reputation
5. **Reward Programs**: Benefits for excellent performers
6. **Public Trust Badges**: Display reputation indicators on storefronts

## Security & Privacy

- Vendor metrics are private (not publicly visible by default)
- Admins have full access for marketplace management
- Audit logs maintained for all reputation-related actions
- Email notifications comply with user preferences

## Testing

### Unit Tests

```bash
pnpm --filter @nearbybazaar/api test reputationMetrics
```

### Manual Testing

1. Create test orders with various statuses
2. Verify metric calculations
3. Test threshold evaluations
4. Check email notifications (in dev mode)
5. Validate dashboard rendering

## Support

For questions or issues with reputation metrics:

- **Vendors**: Contact support with "Reputation" in subject
- **Technical**: See `apps/api/src/services/reputationMetrics.ts`
- **Documentation**: This file + inline code comments
