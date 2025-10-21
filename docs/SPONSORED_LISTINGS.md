# Sponsored Listings & Ad System

**Feature #266: Complete Documentation**

This document provides comprehensive information about the NearbyBazaar sponsored listings and advertising system, enabling vendors to promote their products through paid campaigns with CPC/CPM bidding.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Auction Algorithm](#auction-algorithm)
5. [Campaign Management](#campaign-management)
6. [Click Tracking & Billing](#click-tracking--billing)
7. [Fraud Prevention](#fraud-prevention)
8. [API Endpoints](#api-endpoints)
9. [Integration Guide](#integration-guide)
10. [Admin Operations](#admin-operations)
11. [Performance Optimization](#performance-optimization)
12. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

The sponsored listings system allows vendors to:
- Create advertising campaigns for their products
- Choose between CPC (cost-per-click) or CPM (cost-per-1000-impressions) bidding
- Target specific keywords, categories, and placements
- Track performance metrics (impressions, clicks, CTR, conversions)
- Control budgets at daily and campaign-total levels

### Key Features

✅ **Flexible Bidding**: Support for both CPC and CPM bid types  
✅ **Multi-Placement**: Search results, category pages, homepage, product detail pages  
✅ **Smart Auction**: Combines bid amount, relevance score, and quality score  
✅ **Budget Control**: Daily and total budget limits with auto-pause  
✅ **Fraud Prevention**: Duplicate click detection with 5-minute window  
✅ **Performance Tracking**: Real-time analytics and conversion tracking  
✅ **Wallet Integration**: Automatic charging from vendor wallet

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Ad System Architecture                   │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Vendor     │─────▶│   Campaign   │─────▶│   Auction    │
│  Dashboard   │      │  Management  │      │   Service    │
└──────────────┘      └──────────────┘      └──────────────┘
                              │                      │
                              ▼                      ▼
                      ┌──────────────┐      ┌──────────────┐
                      │   AdCampaign │      │  Ad Results  │
                      │     Model    │      │   (with      │
                      └──────────────┘      │  Sponsored   │
                                            │   label)     │
                                            └──────────────┘
                                                    │
                    ┌───────────────────────────────┴────────┐
                    ▼                                        ▼
            ┌──────────────┐                        ┌──────────────┐
            │  Impression  │                        │    Click     │
            │   Tracking   │                        │   Tracking   │
            └──────────────┘                        └──────────────┘
                    │                                        │
                    └───────────────────┬────────────────────┘
                                        ▼
                                ┌──────────────┐
                                │   AdClick    │
                                │    Model     │
                                └──────────────┘
                                        │
                                        ▼
                                ┌──────────────┐
                                │    Wallet    │
                                │   Charging   │
                                └──────────────┘
```

### Data Flow

1. **Campaign Creation**: Vendor creates campaign with bid, budget, targeting
2. **Ad Serving**: Auction service selects winning ads based on score
3. **Impression**: Ad shown to user, impression recorded
4. **Click**: User clicks ad, fraud check, wallet charge, click recorded
5. **Conversion**: If user purchases, conversion tracked for ROI analysis

---

## Data Models

### AdCampaign Model

**Location**: `apps/api/src/models/AdCampaign.ts`

**Schema**:

```typescript
{
  vendor: ObjectId,           // Campaign owner
  product: ObjectId,          // Promoted product
  name: String,               // Campaign name
  status: 'draft' | 'active' | 'paused' | 'completed' | 'expired',
  
  // Bidding
  bidType: 'cpc' | 'cpm',     // Cost per click or per 1000 impressions
  bidAmount: Number,          // Bid in rupees
  
  // Budget
  dailyBudget: Number,        // Max spend per day
  totalBudget: Number,        // Max total spend
  spentToday: Number,         // Current day spend
  spentTotal: Number,         // Cumulative spend
  
  // Dates
  startDate: Date,            // Campaign start
  endDate: Date,              // Campaign end
  
  // Targeting
  keywords: [String],         // Target keywords
  placements: ['search' | 'category' | 'homepage' | 'product_detail'],
  targetCategories: [String], // Category IDs
  
  // Metrics
  impressions: Number,        // Total impressions served
  clicks: Number,             // Total clicks received
  ctr: Number,                // Click-through rate (calculated)
  avgCPC: Number,             // Average cost per click
  lastServed: Date,           // Last impression timestamp
  
  createdAt: Date,
  updatedAt: Date
}
```

**Key Methods**:

- `canServe()`: Check if campaign can currently serve ads
- `recordImpression()`: Increment impression count
- `recordClick(cost)`: Increment clicks, update spend and CTR
- `resetDailySpend()`: Reset daily budget counter
- `getActiveCampaigns(keywords, placement, categoryId)`: Get eligible campaigns

**Indexes**:

```typescript
{ vendor: 1, status: 1 }
{ status: 1, startDate: 1, endDate: 1 }
{ keywords: 1, status: 1 }
{ placements: 1, status: 1 }
```

### AdClick Model

**Location**: `apps/api/src/models/AdClick.ts`

**Schema**:

```typescript
{
  campaign: ObjectId,         // Campaign reference
  vendor: ObjectId,           // Vendor (for analytics)
  product: ObjectId,          // Product clicked
  user: ObjectId,             // User (if logged in)
  sessionId: String,          // Session ID (if anonymous)
  placement: String,          // Where ad was shown
  keyword: String,            // Search keyword (if search placement)
  cost: Number,               // Cost for this click
  
  // Metadata
  ipAddress: String,          // Client IP
  userAgent: String,          // Browser info
  referer: String,            // Referring page
  clickedAt: Date,            // When clicked
  
  // Conversion tracking
  convertedToOrder: Boolean,  // Did this lead to purchase?
  orderId: ObjectId           // Order if converted
}
```

**Fraud Prevention**:

TTL indexes automatically delete duplicate click records after 5 minutes:

```typescript
{ user: 1, campaign: 1, clickedAt: 1 }, { expireAfterSeconds: 300 }
{ sessionId: 1, campaign: 1, clickedAt: 1 }, { expireAfterSeconds: 300 }
```

**Analytics Indexes**:

```typescript
{ campaign: 1, clickedAt: -1 }
{ vendor: 1, clickedAt: -1 }
{ convertedToOrder: 1, clickedAt: -1 }
```

---

## Auction Algorithm

**Location**: `apps/api/src/services/adAuction.ts`

### Scoring Formula

The auction determines winning ads using a composite score:

```
Final Score = Bid Amount × (Relevance Score / 100) × (Quality Score / 100)
```

This ensures that:
- Higher bids have advantage
- Poor relevance/quality reduces effectiveness of high bids
- Well-targeted ads can win with lower bids

### Relevance Score (0-100 points)

Calculated based on:

1. **Keyword Matching (0-50 points)**
   ```typescript
   const matchedKeywords = campaign.keywords.filter(k => 
     searchKeywords.some(sk => sk.includes(k) || k.includes(sk))
   );
   const ratio = matchedKeywords.length / max(searchKeywords.length, campaign.keywords.length);
   score += ratio * 50;
   ```

2. **Category Matching (0-30 points)**
   ```typescript
   if (campaign.targetCategories.includes(requestCategoryId)) {
     score += 30;
   }
   ```

3. **Placement Matching (0-20 points)**
   ```typescript
   if (campaign.placements.includes(requestPlacement)) {
     score += 20;
   }
   ```

### Quality Score (50-100 points)

Based on campaign performance history:

1. **CTR Performance (0-30 points)**
   - CTR ≥ 5%: +30 points (excellent)
   - CTR ≥ 2%: +15 points (good)
   - CTR < 2%: +0 points
   - Requires at least 100 impressions for reliability

2. **Recency Boost (0-20 points)**
   - Last served < 1 hour ago: +20 points
   - Last served < 24 hours ago: +10 points
   - Older: +0 points

### Example Scoring

**Campaign A**:
- Bid: ₹10 CPC
- Relevance: 80/100 (good keyword match, right category)
- Quality: 70/100 (decent CTR)
- **Final Score**: 10 × 0.8 × 0.7 = 5.6

**Campaign B**:
- Bid: ₹15 CPC
- Relevance: 30/100 (poor keyword match)
- Quality: 50/100 (no performance history)
- **Final Score**: 15 × 0.3 × 0.5 = 2.25

**Winner**: Campaign A (better targeting beats higher bid)

### Auction Process

```typescript
export async function runAdAuction(context: AuctionContext): Promise<AdResult[]> {
  // 1. Get eligible campaigns
  const campaigns = await AdCampaign.getActiveCampaigns(
    context.keywords,
    context.placement,
    context.categoryId
  );

  // 2. Score each campaign
  const scoredAds = campaigns.map(campaign => ({
    campaign,
    score: calculateScore(campaign, context),
    // ... other metrics
  }));

  // 3. Sort by score descending
  scoredAds.sort((a, b) => b.score - a.score);

  // 4. Take top N
  const winners = scoredAds.slice(0, context.limit);

  // 5. Record impressions
  await Promise.all(winners.map(w => w.campaign.recordImpression()));

  // 6. Return formatted results
  return winners.map(w => ({
    campaign: w.campaign,
    product: w.campaign.product,
    vendor: w.campaign.vendor,
    score: w.score,
    isSponsored: true, // Flag for UI
  }));
}
```

---

## Campaign Management

### Creating a Campaign

**Endpoint**: `POST /v1/campaigns`

**Request Body**:

```json
{
  "product": "64a1b2c3d4e5f6789abcdef0",
  "name": "Summer Sale - T-Shirts",
  "bidType": "cpc",
  "bidAmount": 8,
  "dailyBudget": 500,
  "totalBudget": 10000,
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-01-31T23:59:59Z",
  "keywords": ["t-shirt", "summer", "cotton"],
  "placements": ["search", "category"],
  "targetCategories": ["64b1c2d3e4f5g6789abcdef1"]
}
```

**Validation Rules**:

- ✅ `bidAmount > 0`
- ✅ `dailyBudget > 0` and `≤ totalBudget`
- ✅ `totalBudget > 0`
- ✅ `endDate > startDate`
- ✅ CPC bid ≥ ₹1
- ✅ CPM bid ≥ ₹10
- ✅ At least 1 keyword
- ✅ At least 1 placement
- ⚠️ TODO: Check vendor wallet balance ≥ totalBudget

**Response**:

```json
{
  "_id": "64c1d2e3f4g5h6789abcdef2",
  "vendor": "64a1b2c3d4e5f6789abcdef0",
  "product": {
    "_id": "64a1b2c3d4e5f6789abcdef0",
    "name": "Premium Cotton T-Shirt",
    "slug": "premium-cotton-t-shirt"
  },
  "status": "draft",
  "bidType": "cpc",
  "bidAmount": 8,
  "impressions": 0,
  "clicks": 0,
  "ctr": 0,
  "spentToday": 0,
  "spentTotal": 0,
  "createdAt": "2025-01-20T10:30:00Z"
}
```

### Campaign Lifecycle

```
┌──────────┐
│  draft   │ ──activate──▶ ┌────────┐
└──────────┘                │ active │
                            └────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌─────────┐  ┌──────────┐  ┌──────────┐
              │ paused  │  │ expired  │  │completed │
              └─────────┘  └──────────┘  └──────────┘
                    │
                    └─resume─▶ active
```

**Status Transitions**:

- `draft → active`: Manual (campaign starts)
- `active → paused`: Manual or auto (budget exhausted)
- `paused → active`: Manual (resume)
- `active → expired`: Auto (end date reached)
- `active → completed`: Auto (end date + budget spent)

### Estimating Campaign Performance

**Endpoint**: `POST /v1/campaigns/estimate`

**Request**:

```json
{
  "keywords": ["smartphone"],
  "placement": "search",
  "bidAmount": 10,
  "bidType": "cpc",
  "dailyBudget": 1000
}
```

**Response**:

```json
{
  "estimatedDailyImpressions": 5000,
  "estimatedDailyClicks": 100,
  "estimatedDailyCost": 1000,
  "estimatedCTR": 0.02
}
```

---

## Click Tracking & Billing

**Location**: `apps/api/src/services/adTracking.ts`

### Recording Impressions

**Endpoint**: `POST /v1/ad-tracking/impression`

**Request**:

```json
{
  "campaignId": "64c1d2e3f4g5h6789abcdef2",
  "userId": "64a1b2c3d4e5f6789abcdef0",  // optional
  "sessionId": "sess_abc123",             // optional
  "placement": "search",
  "keyword": "smartphone"                 // optional
}
```

**Process**:

1. Validate campaign exists
2. Increment campaign impressions
3. Update `lastServed` timestamp
4. Return success

### Recording Clicks

**Endpoint**: `POST /v1/ad-tracking/click`

**Request**:

```json
{
  "campaignId": "64c1d2e3f4g5h6789abcdef2",
  "userId": "64a1b2c3d4e5f6789abcdef0",  // optional
  "sessionId": "sess_abc123",             // optional
  "placement": "search",
  "keyword": "smartphone"                 // optional
}
```

**Process**:

```typescript
async function recordClick(data: ClickData): Promise<TrackingResult> {
  // 1. Fraud check: duplicate within 5 minutes?
  const isDuplicate = await detectDuplicateClick(data);
  if (isDuplicate) {
    return { success: false, message: 'Duplicate click' };
  }

  // 2. Get campaign and check if can serve
  const campaign = await AdCampaign.findById(data.campaignId);
  if (!campaign.canServe()) {
    return { success: false, message: 'Budget exhausted' };
  }

  // 3. Calculate cost
  const cost = calculateClickCost(campaign); // CPC or estimated CPC for CPM

  // 4. Charge vendor wallet
  const charged = await chargeVendorWallet(
    campaign.vendor,
    cost,
    campaign._id
  );
  if (!charged) {
    return { success: false, message: 'Wallet charge failed' };
  }

  // 5. Create click record
  const click = new AdClick({
    campaign: campaign._id,
    vendor: campaign.vendor,
    product: campaign.product,
    user: data.userId,
    sessionId: data.sessionId,
    placement: data.placement,
    keyword: data.keyword,
    cost,
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer'],
  });
  await click.save();

  // 6. Update campaign metrics
  await campaign.recordClick(cost);

  return {
    success: true,
    cost,
    clickId: click._id,
  };
}
```

### Cost Calculation

**CPC Campaigns**: Direct bid amount

```typescript
if (campaign.bidType === 'cpc') {
  return campaign.bidAmount; // e.g., ₹10
}
```

**CPM Campaigns**: Estimated CPC based on CTR

```typescript
if (campaign.bidType === 'cpm') {
  const estimatedCTR = campaign.ctr > 0 ? campaign.ctr : 0.02; // Default 2%
  return (campaign.bidAmount / 1000) / estimatedCTR;
  // Example: ₹50 CPM / 1000 / 0.02 = ₹2.5 per click
}
```

### Conversion Tracking

When a user completes a purchase, link it back to the ad click:

```typescript
// In order creation logic
if (req.session.lastAdClick) {
  await recordConversion(req.session.lastAdClick, order._id);
}
```

---

## Fraud Prevention

### Duplicate Click Detection

**Method**: TTL indexes on AdClick model

**Time Window**: 5 minutes

**Logic**:

```typescript
async function detectDuplicateClick(data: ClickData): Promise<boolean> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const query: any = {
    campaign: data.campaignId,
    clickedAt: { $gte: fiveMinutesAgo },
  };
  
  if (data.userId) {
    query.user = data.userId;
  } else if (data.sessionId) {
    query.sessionId = data.sessionId;
  } else {
    return false; // Can't detect without identifier
  }
  
  const existingClick = await AdClick.findOne(query);
  return existingClick !== null;
}
```

**MongoDB Indexes**:

```javascript
db.adclicks.createIndex(
  { user: 1, campaign: 1, clickedAt: 1 },
  { expireAfterSeconds: 300 }
);

db.adclicks.createIndex(
  { sessionId: 1, campaign: 1, clickedAt: 1 },
  { expireAfterSeconds: 300 }
);
```

### Fraud Pattern Detection

**Endpoint**: `GET /v1/campaigns/:id/fraud-check` (Admin only)

**Patterns Detected**:

1. **Rapid clicks from same IP**
   ```typescript
   if (clicksByIP[ip] > 10 in 24 hours) {
     flag as suspicious
   }
   ```

2. **Multiple clicks without conversions**
   ```typescript
   if (sessionClicks.length > 5 && conversions === 0) {
     flag as suspicious
   }
   ```

3. **Very low conversion rate**
   ```typescript
   if (clicks > 50 && conversionRate < 0.1%) {
     flag as suspicious
   }
   ```

**Admin Actions**:

- Review flagged campaigns
- Refund vendor wallet if fraud confirmed
- Pause campaign
- Block suspicious users/IPs

---

## API Endpoints

### Campaign Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/v1/campaigns` | List vendor's campaigns | Vendor |
| POST | `/v1/campaigns` | Create new campaign | Vendor |
| GET | `/v1/campaigns/:id` | Get campaign details | Vendor/Admin |
| PUT | `/v1/campaigns/:id` | Update campaign | Vendor/Admin |
| POST | `/v1/campaigns/:id/pause` | Pause campaign | Vendor/Admin |
| POST | `/v1/campaigns/:id/resume` | Resume campaign | Vendor/Admin |
| DELETE | `/v1/campaigns/:id` | Delete draft campaign | Vendor/Admin |
| GET | `/v1/campaigns/:id/stats` | Get analytics | Vendor/Admin |
| POST | `/v1/campaigns/estimate` | Estimate performance | Public |

### Ad Tracking

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/ad-tracking/impression` | Record impression | Public |
| POST | `/v1/ad-tracking/click` | Record click | Public |

### Admin Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/v1/admin/ad-revenue` | Total revenue stats | Admin |
| GET | `/v1/admin/top-advertisers` | Top spending vendors | Admin |
| GET | `/v1/admin/fraud-alerts` | Suspicious activity | Admin |

---

## Integration Guide

### Frontend Integration

#### 1. Display Sponsored Ads in Search Results

```typescript
// In search page component
async function loadSearchResults(query: string) {
  // Get organic results
  const products = await fetch(`/v1/search?q=${query}`).then(r => r.json());
  
  // Get sponsored ads
  const ads = await fetch(`/v1/ad-auction/search?q=${query}&limit=2`)
    .then(r => r.json());
  
  // Merge with "Sponsored" label
  const results = [
    ...ads.map(ad => ({ ...ad.product, isSponsored: true, campaignId: ad.campaign._id })),
    ...products
  ];
  
  return results;
}
```

#### 2. Track Impressions

```typescript
useEffect(() => {
  // When sponsored ad is rendered
  if (product.isSponsored) {
    fetch('/v1/ad-tracking/impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: product.campaignId,
        userId: user?.id,
        sessionId: getSessionId(),
        placement: 'search',
        keyword: searchQuery,
      }),
    });
  }
}, [product]);
```

#### 3. Track Clicks

```typescript
function handleProductClick(product) {
  if (product.isSponsored) {
    // Record click before navigation
    fetch('/v1/ad-tracking/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: product.campaignId,
        userId: user?.id,
        sessionId: getSessionId(),
        placement: 'search',
        keyword: searchQuery,
      }),
    }).then(response => {
      if (response.ok) {
        // Store click ID for conversion tracking
        sessionStorage.setItem('lastAdClick', response.clickId);
      }
    });
  }
  
  // Navigate to product
  router.push(`/p/${product.slug}`);
}
```

#### 4. Display "Sponsored" Badge

```tsx
<ProductCard>
  {product.isSponsored && (
    <Badge className="sponsored-badge">
      Sponsored
    </Badge>
  )}
  <ProductImage src={product.image} />
  <ProductTitle>{product.name}</ProductTitle>
  <ProductPrice>{product.price}</ProductPrice>
</ProductCard>
```

### Backend Integration

#### Modify Search Endpoint

```typescript
// apps/api/src/routes/search.ts
router.get('/', async (req, res) => {
  const { q, includeAds = 'true', adLimit = 2 } = req.query;
  
  // Get organic results
  const products = await searchProducts(q);
  
  // Get sponsored ads if requested
  let ads = [];
  if (includeAds === 'true') {
    ads = await getSearchAds(q, Number(adLimit));
  }
  
  res.json({
    organic: products,
    sponsored: ads,
  });
});
```

---

## Admin Operations

### Daily Budget Reset Job

**Schedule**: Every day at 00:00 UTC

**Job**: `apps/api/src/jobs/resetAdBudgets.ts`

**Actions**:

1. Reset `spentToday` to 0 for all campaigns
2. Mark campaigns as `expired` if `endDate` passed
3. Pause campaigns that exhausted `totalBudget`
4. Mark campaigns as `completed` if ended and budget spent

**Cron Configuration**:

```typescript
// Using node-cron or BullMQ scheduler
cron.schedule('0 0 * * *', async () => {
  await resetAdBudgets();
}, {
  timezone: 'UTC'
});
```

**Manual Trigger** (for testing):

```bash
curl -X POST http://localhost:5000/v1/admin/trigger-budget-reset \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Monitoring Dashboard

**Metrics to Track**:

- Total ad revenue (daily, weekly, monthly)
- Active campaigns count
- Top spending vendors
- Average CTR across platform
- Fraud alerts count
- Budget utilization rate

**Sample Query**:

```typescript
// Get total revenue this month
const clicks = await AdClick.aggregate([
  {
    $match: {
      clickedAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
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

---

## Performance Optimization

### Database Indexing

**Critical Indexes**:

```javascript
// AdCampaign
db.adcampaigns.createIndex({ vendor: 1, status: 1 });
db.adcampaigns.createIndex({ status: 1, startDate: 1, endDate: 1 });
db.adcampaigns.createIndex({ keywords: 1, status: 1 });
db.adcampaigns.createIndex({ placements: 1, status: 1 });

// AdClick
db.adclicks.createIndex({ campaign: 1, clickedAt: -1 });
db.adclicks.createIndex({ vendor: 1, clickedAt: -1 });
db.adclicks.createIndex({ convertedToOrder: 1, clickedAt: -1 });
db.adclicks.createIndex({ user: 1, campaign: 1, clickedAt: 1 }, { expireAfterSeconds: 300 });
db.adclicks.createIndex({ sessionId: 1, campaign: 1, clickedAt: 1 }, { expireAfterSeconds: 300 });
```

### Caching Strategy

**Redis Cache for Active Campaigns**:

```typescript
// Cache eligible campaigns for 5 minutes
const cacheKey = `ads:${placement}:${categoryId}:${keywords.join(',')}`;
let campaigns = await redis.get(cacheKey);

if (!campaigns) {
  campaigns = await AdCampaign.getActiveCampaigns(keywords, placement, categoryId);
  await redis.setex(cacheKey, 300, JSON.stringify(campaigns));
}
```

**Invalidate on**:

- Campaign status change
- Budget update
- Campaign creation/deletion

### Query Optimization

**Use Lean Queries**:

```typescript
// Don't use populate() in auction (too slow)
const campaigns = await AdCampaign.find(query).lean();

// Populate product details only for winners
for (const winner of winners) {
  winner.product = await Product.findById(winner.product).lean();
}
```

**Limit Fields**:

```typescript
const campaigns = await AdCampaign.find(query)
  .select('vendor product bidAmount bidType keywords placements')
  .lean();
```

---

## Troubleshooting

### Common Issues

#### 1. Campaign Not Serving

**Symptoms**: Campaign status is "active" but not appearing in search results.

**Checklist**:

- ✅ Check `canServe()` returns `true`
  ```typescript
  const campaign = await AdCampaign.findById(campaignId);
  console.log('Can serve:', campaign.canServe());
  console.log('Spent today:', campaign.spentToday, '/', campaign.dailyBudget);
  console.log('Spent total:', campaign.spentTotal, '/', campaign.totalBudget);
  ```

- ✅ Verify dates
  ```typescript
  const now = new Date();
  console.log('Start:', campaign.startDate <= now);
  console.log('End:', !campaign.endDate || campaign.endDate >= now);
  ```

- ✅ Check targeting match
  ```typescript
  console.log('Keywords:', campaign.keywords);
  console.log('Placements:', campaign.placements);
  console.log('Categories:', campaign.targetCategories);
  ```

- ✅ Check relevance score
  ```typescript
  const score = calculateRelevanceScore(campaign, context);
  console.log('Relevance score:', score);
  ```

#### 2. Clicks Not Being Charged

**Symptoms**: Clicks recorded but wallet not charged.

**Debug**:

```typescript
// Check wallet charging function
const result = await recordClick(clickData);
console.log('Click result:', result);

// Check vendor wallet balance
const vendor = await Vendor.findById(vendorId);
console.log('Wallet balance:', vendor.walletBalance);

// Check AdClick created
const click = await AdClick.findById(result.clickId);
console.log('Click cost:', click.cost);
```

**Note**: Wallet charging is currently a stub (TODO in Feature #275: Wallet Features).

#### 3. Duplicate Clicks Not Prevented

**Symptoms**: Same user/session clicking multiple times within 5 minutes.

**Debug**:

```bash
# Check TTL indexes exist
db.adclicks.getIndexes()

# Should see:
# { user: 1, campaign: 1, clickedAt: 1 }, { expireAfterSeconds: 300 }
# { sessionId: 1, campaign: 1, clickedAt: 1 }, { expireAfterSeconds: 300 }
```

**Fix**:

```bash
# Recreate indexes if missing
db.adclicks.createIndex(
  { user: 1, campaign: 1, clickedAt: 1 },
  { expireAfterSeconds: 300 }
);
```

#### 4. Low CTR / Poor Performance

**Analysis**:

```typescript
// Get campaign analytics
const stats = await getCampaignAnalytics(campaignId);

console.log('Total impressions:', stats.totalClicks / stats.avgCTR);
console.log('Total clicks:', stats.totalClicks);
console.log('CTR:', (stats.totalClicks / impressions * 100).toFixed(2) + '%');
console.log('Clicks by keyword:', stats.clicksByKeyword);
console.log('Clicks by placement:', stats.clicksByPlacement);
```

**Recommendations**:

- If CTR < 1%: Refine keywords, improve product images/title
- If CTR good but no conversions: Check product page, pricing
- If certain keywords perform poorly: Remove or lower bid

---

## Next Steps

### Integration TODOs

1. **Wallet System Integration** (Feature #275)
   - Implement actual wallet charging in `chargeVendorWallet()`
   - Add wallet balance checks before campaign activation
   - Support auto-top-up for campaigns

2. **Auth Middleware** (Feature #281-285: OAuth2)
   - Apply auth to campaign management routes
   - Implement vendor-only access checks
   - Add admin override permissions

3. **UI Development** (Feature #266 tasks 5-6)
   - Vendor campaign management dashboard
   - Admin ad revenue dashboard
   - Campaign creation wizard

4. **Email Notifications**
   - Budget alerts (90% spent, exhausted)
   - Daily performance summaries
   - Fraud alerts to admin

5. **Testing**
   - Unit tests for auction algorithm
   - Integration tests for click tracking
   - E2E tests for campaign lifecycle

6. **Advanced Features**
   - A/B testing different ad creatives
   - Automated bid optimization
   - Retargeting campaigns
   - Video ads support

---

## Support

For issues or questions:

- **Documentation**: This file + `docs/AD_AUCTION_ALGORITHM.md`
- **Code**: `apps/api/src/services/adAuction.ts`, `apps/api/src/services/adTracking.ts`
- **Models**: `apps/api/src/models/AdCampaign.ts`, `apps/api/src/models/AdClick.ts`

---

**Last Updated**: January 20, 2025  
**Feature**: #266 - Sponsored Listings (Ads Base)  
**Status**: Backend Complete, UI Pending
