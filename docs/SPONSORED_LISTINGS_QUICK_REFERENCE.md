# Sponsored Listings - Quick Reference

**Feature #266**: Fast lookup guide for developers

---

## Quick Commands

### Create Campaign

```bash
curl -X POST http://localhost:5000/v1/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VENDOR_TOKEN" \
  -d '{
    "product": "PRODUCT_ID",
    "name": "Summer Sale Campaign",
    "bidType": "cpc",
    "bidAmount": 10,
    "dailyBudget": 500,
    "totalBudget": 10000,
    "startDate": "2025-01-20T00:00:00Z",
    "endDate": "2025-02-20T23:59:59Z",
    "keywords": ["t-shirt", "summer"],
    "placements": ["search", "category"]
  }'
```

### Get Search Ads

```bash
curl "http://localhost:5000/v1/search?q=smartphone&includeAds=true&adLimit=2"
```

### Record Impression

```bash
curl -X POST http://localhost:5000/v1/ad-tracking/impression \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "CAMPAIGN_ID",
    "sessionId": "sess_abc123",
    "placement": "search",
    "keyword": "smartphone"
  }'
```

### Record Click

```bash
curl -X POST http://localhost:5000/v1/ad-tracking/click \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "CAMPAIGN_ID",
    "sessionId": "sess_abc123",
    "placement": "search",
    "keyword": "smartphone"
  }'
```

### Get Campaign Stats

```bash
curl "http://localhost:5000/v1/campaigns/CAMPAIGN_ID/stats?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer VENDOR_TOKEN"
```

---

## File Locations

| Component       | Path                                         |
| --------------- | -------------------------------------------- |
| **Models**      |
| AdCampaign      | `apps/api/src/models/AdCampaign.ts`          |
| AdClick         | `apps/api/src/models/AdClick.ts`             |
| **Services**    |
| Auction         | `apps/api/src/services/adAuction.ts`         |
| Tracking        | `apps/api/src/services/adTracking.ts`        |
| **Controllers** |
| Campaigns       | `apps/api/src/controllers/campaigns.ts`      |
| **Routes**      |
| Campaigns       | `apps/api/src/routes/campaigns.ts`           |
| Tracking        | `apps/api/src/routes/adTracking.ts`          |
| **Jobs**        |
| Budget Reset    | `apps/api/src/jobs/resetAdBudgets.ts`        |
| **Docs**        |
| Full Docs       | `docs/SPONSORED_LISTINGS.md`                 |
| Quick Ref       | `docs/SPONSORED_LISTINGS_QUICK_REFERENCE.md` |

---

## Key Functions

### Auction Service

```typescript
// Get search ads
const ads = await getSearchAds(searchQuery, limit);

// Get category ads
const ads = await getCategoryAds(categoryId, limit);

// Get homepage ads
const ads = await getHomepageAds(limit);

// Run custom auction
const ads = await runAdAuction({
  placement: 'search',
  keywords: ['smartphone'],
  categoryId: 'electronics',
  limit: 3,
});

// Validate campaign
const errors = validateCampaign(campaignData);

// Estimate performance
const estimate = await estimateCampaignPerformance(
  keywords,
  placement,
  bidAmount,
  bidType,
  dailyBudget,
);
```

### Tracking Service

```typescript
// Record impression
await recordImpression({
  campaignId,
  userId,
  sessionId,
  placement,
  keyword,
});

// Record click
const result = await recordClick({
  campaignId,
  userId,
  sessionId,
  placement,
  keyword,
  ipAddress,
  userAgent,
  referer,
});

// Record conversion
await recordConversion(clickId, orderId);

// Get campaign analytics
const analytics = await getCampaignAnalytics(campaignId, startDate, endDate);

// Get vendor analytics
const analytics = await getVendorAnalytics(vendorId, startDate, endDate);

// Detect fraud
const fraud = await detectFraudPatterns(campaignId, hours);
```

---

## Common Queries

### MongoDB Queries

**Get active campaigns for vendor**:

```javascript
db.adcampaigns.find({
  vendor: ObjectId('VENDOR_ID'),
  status: 'active',
});
```

**Get campaigns needing budget reset**:

```javascript
db.adcampaigns.find({
  status: 'active',
  $expr: { $gte: ['$spentToday', '$dailyBudget'] },
});
```

**Get expired campaigns**:

```javascript
db.adcampaigns.find({
  status: { $in: ['active', 'paused'] },
  endDate: { $lte: new Date() },
});
```

**Get total ad revenue this month**:

```javascript
db.adclicks.aggregate([
  {
    $match: {
      clickedAt: {
        $gte: ISODate('2025-01-01'),
        $lte: ISODate('2025-01-31'),
      },
    },
  },
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: '$cost' },
      totalClicks: { $sum: 1 },
    },
  },
]);
```

**Get clicks by vendor**:

```javascript
db.adclicks.aggregate([
  {
    $match: {
      vendor: ObjectId('VENDOR_ID'),
      clickedAt: { $gte: ISODate('2025-01-01') },
    },
  },
  {
    $group: {
      _id: '$campaign',
      clicks: { $sum: 1 },
      totalCost: { $sum: '$cost' },
    },
  },
]);
```

**Find suspicious click patterns**:

```javascript
db.adclicks.aggregate([
  {
    $match: {
      clickedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  },
  {
    $group: {
      _id: '$ipAddress',
      clicks: { $sum: 1 },
      campaigns: { $addToSet: '$campaign' },
    },
  },
  {
    $match: {
      clicks: { $gt: 10 },
    },
  },
  {
    $sort: { clicks: -1 },
  },
]);
```

---

## Scoring Reference

### Relevance Score (0-100)

- **Keywords match** (0-50): Based on overlap ratio
- **Category match** (0-30): Exact category match
- **Placement match** (0-20): Ad placement in targeting

### Quality Score (50-100)

- **Base**: 50 points
- **CTR ≥ 5%**: +30 points (excellent)
- **CTR ≥ 2%**: +15 points (good)
- **Last served < 1h**: +20 points
- **Last served < 24h**: +10 points

### Final Score

```
Score = BidAmount × (Relevance/100) × (Quality/100)
```

### Examples

**High bid, poor targeting**:

- Bid: ₹20, Relevance: 20, Quality: 50
- Score: 20 × 0.2 × 0.5 = **2.0**

**Lower bid, good targeting**:

- Bid: ₹10, Relevance: 80, Quality: 70
- Score: 10 × 0.8 × 0.7 = **5.6** ✅ Winner

---

## Status Reference

### Campaign Status

| Status      | Description           | Can Edit   | Can Delete |
| ----------- | --------------------- | ---------- | ---------- |
| `draft`     | Not yet started       | ✅ Yes     | ✅ Yes     |
| `active`    | Currently running     | 🔒 Limited | ❌ No      |
| `paused`    | Temporarily stopped   | ✅ Yes     | ❌ No      |
| `expired`   | End date reached      | ❌ No      | ❌ No      |
| `completed` | Finished successfully | ❌ No      | ❌ No      |

### Budget States

```typescript
// Can serve if:
status === 'active' &&
  now >= startDate &&
  (!endDate || now <= endDate) &&
  spentToday < dailyBudget &&
  spentTotal < totalBudget;
```

---

## Validation Rules

### Creating Campaign

✅ **Required**:

- `product` (ObjectId)
- `name` (string)
- `bidType` ('cpc' | 'cpm')
- `bidAmount` (number > 0)
- `dailyBudget` (number > 0)
- `totalBudget` (number > 0)
- `keywords` (array, min 1)
- `placements` (array, min 1)

✅ **Constraints**:

- `dailyBudget ≤ totalBudget`
- `endDate > startDate` (if provided)
- CPC bid ≥ ₹1
- CPM bid ≥ ₹10

---

## Integration Checklist

### Frontend

- [ ] Display "Sponsored" badge on ads
- [ ] Track impressions when ad visible
- [ ] Track clicks before navigation
- [ ] Store clickId for conversion tracking
- [ ] Vendor campaign dashboard UI
- [ ] Campaign creation wizard
- [ ] Analytics charts

### Backend

- [ ] Apply auth middleware to routes
- [ ] Integrate wallet charging
- [ ] Add email notifications
- [ ] Implement fraud review workflow
- [ ] Set up cron for budget reset
- [ ] Add conversion tracking to orders
- [ ] Write unit tests

### Database

- [ ] Create all indexes (see SPONSORED_LISTINGS.md)
- [ ] Test TTL indexes for fraud prevention
- [ ] Set up MongoDB replica set (for transactions)
- [ ] Configure backup strategy

---

## Testing Scenarios

### Happy Path

1. Vendor creates CPC campaign
2. Campaign appears in search results (if relevant)
3. User sees "Sponsored" badge
4. Impression tracked
5. User clicks ad
6. Click tracked, wallet charged
7. User purchases product
8. Conversion recorded

### Edge Cases

- Budget exhausted mid-day → pause campaign
- Duplicate click within 5 min → reject
- Campaign end date reached → mark expired
- Invalid bid amount → validation error
- Missing keywords → validation error

---

## Environment Variables

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/nearbybazaar

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Server
PORT=5000
NODE_ENV=development

# JWT (for auth)
JWT_SECRET=your-secret-key

# Wallet integration (TODO)
WALLET_API_URL=https://wallet-service.example.com
WALLET_API_KEY=your-wallet-api-key
```

---

## Performance Tips

1. **Use lean queries** for auctions (no populate)
2. **Cache active campaigns** in Redis (5 min TTL)
3. **Batch impression tracking** (queue, process every 10s)
4. **Index frequently queried fields**
5. **Limit campaign keyword count** (max 50)
6. **Archive old clicks** (>90 days to separate collection)

---

## Troubleshooting

**Campaign not showing?**

```typescript
const campaign = await AdCampaign.findById(id);
console.log(campaign.canServe()); // Should be true
console.log(campaign.status); // Should be 'active'
console.log(campaign.keywords); // Should match search
```

**Clicks not charged?**

```typescript
// Check wallet integration (currently stub)
// TODO: Implement actual wallet deduction
```

**High fraud alerts?**

```typescript
const fraud = await detectFraudPatterns(campaignId, 24);
console.log(fraud.suspiciousPatterns);
// Review patterns, block suspicious IPs/users
```

---

## Next Implementation

**Priority Order**:

1. ✅ Data models (AdCampaign, AdClick)
2. ✅ Auction service (ad selection)
3. ✅ Tracking service (impression, click, fraud)
4. ✅ Campaign API (CRUD, pause, resume)
5. ✅ Routes (campaigns, tracking)
6. ✅ Background job (budget reset)
7. ✅ Documentation
8. ⏳ **Search/category integration** (modify endpoints)
9. ⏳ **Vendor UI** (campaign dashboard)
10. ⏳ **Admin UI** (ad revenue dashboard)
11. ⏳ **Wallet integration** (actual charging)
12. ⏳ **Tests** (unit, integration, E2E)

---

**Last Updated**: January 20, 2025  
**Feature**: #266 - Sponsored Listings
