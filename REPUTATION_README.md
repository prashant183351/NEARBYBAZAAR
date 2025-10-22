# 🏆 Marketplace Reputation Metrics System

> **Feature #264** - Complete seller performance tracking and automated quality control

## Quick Start

### For Vendors

1. **View Your Scorecard**: Navigate to `/dashboard/reputation`
2. **Check Your Status**: See color-coded metrics (🟢 Excellent, 🔵 Good, 🟠 Warning, 🔴 Critical)
3. **Improve Performance**: Follow on-screen tips for each metric

### For Admins

1. **Monitor All Vendors**: Go to `/admin/dashboard/reputation`
2. **Filter by Status**: Click summary cards to filter (Critical, Needs Improvement, etc.)
3. **Take Action**: Use action buttons for vendors requiring intervention

---

## 📊 The Three Key Metrics

| Metric                      | Formula                                               | What It Measures                       | Critical Threshold |
| --------------------------- | ----------------------------------------------------- | -------------------------------------- | ------------------ |
| **Order Defect Rate (ODR)** | `(Refunds + Returns + Disputes) / Total Orders × 100` | Order quality & customer satisfaction  | ≥ 3%               |
| **Late Shipment Rate**      | `Late Shipments / Total Shipments × 100`              | Shipping reliability & SLA adherence   | ≥ 10%              |
| **Cancellation Rate**       | `Vendor Cancellations / Total Orders × 100`           | Inventory accuracy & order fulfillment | ≥ 7.5%             |

---

## 🎯 Performance Thresholds

```
🟢 EXCELLENT    🔵 GOOD         🟠 WARNING      🔴 CRITICAL
ODR:     <0.5%      0.5-1%         1-2%           ≥3%
Late:    <2%        2-4%           4-7%           ≥10%
Cancel:  <1%        1-2.5%         2.5-5%         ≥7.5%
```

---

## 🚀 Getting Started

### 1. API Integration

```typescript
// Vendor checks own metrics
const response = await fetch('/v1/reputation/vendor?days=30', {
  headers: { Authorization: `Bearer ${vendorToken}` },
});
const { orderDefectRate, lateShipmentRate, cancellationRate, status } = response.data;
```

### 2. Order Tracking Setup

Ensure your order processing populates these fields:

```typescript
{
  vendor: vendorId,              // Required
  shippedAt: new Date(),         // When actually shipped
  expectedDispatchDate: date,    // Expected ship date
  hasDispute: boolean,           // If dispute raised
  cancelledBy: 'vendor' | 'buyer' | 'admin',
  cancellationReason: string,
  status: 'pending' | 'shipped' | 'delivered' | 'refunded' | 'returned' | 'cancelled'
}
```

### 3. Background Monitoring

```typescript
import { checkVendorReputations } from './jobs/checkVendorReputation';

// Schedule daily at 2 AM
scheduler.add('reputation-check', checkVendorReputations, {
  cron: '0 2 * * *',
});
```

---

## 📁 File Structure

```
apps/
  api/src/
    services/
      reputationMetrics.ts          ← Core calculation engine
    controllers/metrics/
      reputation.ts                 ← API controllers
    routes/
      reputation.ts                 ← Express routes
    jobs/
      checkVendorReputation.ts      ← Background monitoring
    models/
      Order.ts                      ← Extended with reputation fields
      RecommendationLog.ts          ← Tracking model
      ABTestLog.ts                  ← A/B test logs
    seeders/
      reputationTestData.ts         ← Test data generator

  vendor/pages/dashboard/
    reputation.tsx                  ← Vendor scorecard UI

  admin/pages/dashboard/
    reputation.tsx                  ← Admin monitoring UI

docs/
  REPUTATION_METRICS.md             ← Complete documentation
  REPUTATION_QUICK_REFERENCE.md    ← Quick reference guide
  FEATURE_264_SUMMARY.md            ← Implementation summary
```

---

## 🧪 Testing

### Generate Test Data

```typescript
import { generateTestReputationData } from './seeders/reputationTestData';

// For single vendor
await generateTestReputationData(vendorId, 100);

// For multiple vendors
await generateMultiVendorTestData();
```

### Manual Testing Checklist

- [ ] Create order with dispute → ODR increases
- [ ] Ship order after expected date → Late rate increases
- [ ] Cancel order as vendor → Cancel rate increases
- [ ] Verify status changes at thresholds
- [ ] Check email notifications (if configured)
- [ ] Test vendor dashboard rendering
- [ ] Test admin dashboard filtering
- [ ] Verify API responses match expected format

### Automated Tests

```bash
pnpm --filter @nearbybazaar/api test reputation
```

---

## 🔔 Automated Actions

### Warning Email (Needs Improvement Status)

Triggered when vendor exceeds warning thresholds.

- **Recipients**: Vendor email
- **Action**: Informational, no account restrictions
- **Frequency**: Daily check

### Critical Alert (Critical Status)

Triggered when vendor exceeds critical thresholds.

- **Recipients**: Vendor + Admin
- **Action**: Admin review for potential suspension
- **Frequency**: Daily check

---

## 💡 Best Practices

### For Vendors

1. **Monitor Daily**: Check your scorecard regularly
2. **Set Realistic SLAs**: Don't promise what you can't deliver
3. **Sync Inventory**: Keep stock levels accurate
4. **Communicate**: Proactive buyer communication reduces disputes
5. **Quality Control**: Review products before shipping

### For Platform Admins

1. **Weekly Reviews**: Check the admin dashboard weekly
2. **Trend Analysis**: Look for patterns in declining metrics
3. **Proactive Support**: Reach out to vendors showing warning signs
4. **Fair Enforcement**: Use metrics as guide, not absolute rule
5. **Seasonal Adjustments**: Consider peak seasons when evaluating

---

## 🔧 Configuration

### Threshold Customization

Edit `apps/api/src/services/reputationMetrics.ts`:

```typescript
const THRESHOLDS: ReputationThresholds = {
  odr: { excellent: 0.5, good: 1, warning: 2, critical: 3 },
  lateShipment: { excellent: 2, good: 4, warning: 7, critical: 10 },
  cancellation: { excellent: 1, good: 2.5, warning: 5, critical: 7.5 },
};
```

### Period Customization

Default is 30 days. Users can select 7, 30, or 90 days via UI or API:

```
GET /v1/reputation/vendor?days=90
```

---

## 🐛 Troubleshooting

### Metrics Show 0% for All

- **Cause**: No orders in selected period or missing vendor reference
- **Fix**: Verify orders have `vendor` field populated

### Late Shipment Rate Incorrect

- **Cause**: Missing `shippedAt` or `expectedDispatchDate`
- **Fix**: Ensure both fields are set when processing orders

### Background Job Not Running

- **Cause**: Job scheduler not configured
- **Fix**: Add job to scheduler (see Getting Started #3)

---

## 📈 Roadmap

### Phase 1 (Current) ✅

- [x] Core metrics calculation
- [x] Vendor & admin dashboards
- [x] API endpoints
- [x] Background monitoring
- [x] Documentation

### Phase 2 (Future)

- [ ] ML-based predictive analytics
- [ ] Automated improvement coaching
- [ ] Peer benchmarking
- [ ] Public trust badges
- [ ] Mobile app integration

### Phase 3 (Future)

- [ ] Real-time metric updates
- [ ] Custom threshold per category
- [ ] Vendor performance rewards
- [ ] Integration with review system

---

## 🤝 Support

- **Documentation**: See `docs/REPUTATION_METRICS.md`
- **API Reference**: OpenAPI docs at `/v1/docs`
- **Technical Issues**: Check `apps/api/src/services/reputationMetrics.ts`
- **UI Issues**: Check dashboard components in `apps/vendor/pages/dashboard/`

---

## 📝 License & Credits

Part of NearbyBazaar e-commerce platform.
Implemented as Feature #264 - Marketplace Reputation Metrics.

**Implementation Date**: October 20, 2025
**Status**: ✅ Production Ready
