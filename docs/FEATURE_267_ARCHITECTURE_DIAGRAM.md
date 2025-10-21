# Feature #267: Ad Management Dashboard - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FEATURE #267 ARCHITECTURE                               │
│                        Ad Management Dashboard System                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 FRONTEND LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                          VENDOR APPLICATION                               │  │
│  │                      (apps/vendor - Port 3002)                            │  │
│  ├──────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                           │  │
│  │  📊 CAMPAIGNS DASHBOARD (/campaigns/index.tsx)                           │  │
│  │  ┌─────────────────────────────────────────────────────────────┐        │  │
│  │  │ Date Filter: [7 days] [30 days] [90 days]                  │        │  │
│  │  ├─────────────────────────────────────────────────────────────┤        │  │
│  │  │ Summary Cards:                                              │        │  │
│  │  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │        │  │
│  │  │ │ Total  │ │ Total  │ │  Avg   │ │ Total  │               │        │  │
│  │  │ │Campaigns│ │Impressions│  CTR   │ Spent  │               │        │  │
│  │  │ └────────┘ └────────┘ └────────┘ └────────┘               │        │  │
│  │  ├─────────────────────────────────────────────────────────────┤        │  │
│  │  │ Budget Overview:                                            │        │  │
│  │  │ Total: ₹50K  [████████░░] 30% used                         │        │  │
│  │  │ Today: ₹2K   [█████░░░░░] 22% used                         │        │  │
│  │  ├─────────────────────────────────────────────────────────────┤        │  │
│  │  │ Top Campaigns (by CTR):                                     │        │  │
│  │  │ 1. Summer Sale    2.4% CTR  ₹6K spent                      │        │  │
│  │  │ 2. New Arrivals  2.1% CTR  ₹4K spent                      │        │  │
│  │  ├─────────────────────────────────────────────────────────────┤        │  │
│  │  │ All Campaigns Table:                                        │        │  │
│  │  │ [Img] Name      Status  Bid  Impressions  CTR  Spent       │        │  │
│  │  │ [📦]  Campaign1 Active  ₹5   10,000      2%   ₹500         │        │  │
│  │  │                         [View] [Edit]                       │        │  │
│  │  └─────────────────────────────────────────────────────────────┘        │  │
│  │                              │                                           │  │
│  │                              │ API Call: GET /ad-dashboard/vendor/summary│  │
│  │                              ▼                                           │  │
│  │                                                                           │  │
│  │  🛠️ CAMPAIGN CREATION WIZARD (/campaigns/create.tsx)                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐        │  │
│  │  │ Progress: [1✓] [2✓] [3✓] [4]                               │        │  │
│  │  ├─────────────────────────────────────────────────────────────┤        │  │
│  │  │ Step 1: Basic Info          Step 2: Budget & Bid           │        │  │
│  │  │ • Campaign name             • CPC vs CPM                    │        │  │
│  │  │ • Product selection         • Bid amount                    │        │  │
│  │  │ • Start/End dates           • Daily/Total budget            │        │  │
│  │  │                             • Est. performance               │        │  │
│  │  ├─────────────────────────────────────────────────────────────┤        │  │
│  │  │ Step 3: Targeting           Step 4: Review & Submit        │        │  │
│  │  │ • Keywords (add/remove)     • Summary of all settings       │        │  │
│  │  │ • Placements (checkboxes)   • [Create Campaign] button     │        │  │
│  │  └─────────────────────────────────────────────────────────────┘        │  │
│  │                              │                                           │  │
│  │                              │ API Call: POST /campaigns                 │  │
│  │                              ▼                                           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                          ADMIN APPLICATION                                │  │
│  │                      (apps/admin - Port 3003)                             │  │
│  ├──────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                           │  │
│  │  📈 ADVERTISING DASHBOARD (/advertising/dashboard.tsx)                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐        │  │
│  │  │ Platform Metrics:                                           │        │  │
│  │  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │        │  │
│  │  │ │ Total  │ │ Active │ │ Total  │ │  Avg   │               │        │  │
│  │  │ │Revenue │ │Campaigns│ Impressions│Rev/Click│               │        │  │
│  │  │ └────────┘ └────────┘ └────────┘ └────────┘               │        │  │
│  │  ├─────────────────────────────────────────────────────────────┤        │  │
│  │  │ 🚨 Alerts:                                                  │        │  │
│  │  │ Suspicious Campaigns:    High Spend Campaigns:             │        │  │
│  │  │ • Low CTR detected       • Campaign at 85% budget          │        │  │
│  │  │   (0.3% CTR, 200 clicks)   (₹8.5K of ₹10K)                 │        │  │
│  │  ├─────────────────────────────────────────────────────────────┤        │  │
│  │  │ Top Vendors (by spend):                                     │        │  │
│  │  │ #  Vendor         Spent    Campaigns  Impressions  CTR     │        │  │
│  │  │ 1  TopVendor Inc ₹25K      8          500K        2.0%     │        │  │
│  │  │ 2  GrowthCo      ₹18K      5          300K        1.8%     │        │  │
│  │  ├─────────────────────────────────────────────────────────────┤        │  │
│  │  │ Placement Performance:                                      │        │  │
│  │  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │        │  │
│  │  │ │  Search  │ │ Category │ │ Homepage │ │Product Pg│       │        │  │
│  │  │ │ 50K clks │ │ 30K clks │ │ 15K clks │ │ 5K clks  │       │        │  │
│  │  │ │ ₹75K rev │ │ ₹45K rev │ │ ₹22.5Krev│ │ ₹7.5K rev│       │        │  │
│  │  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │        │  │
│  │  ├─────────────────────────────────────────────────────────────┤        │  │
│  │  │ Daily Revenue (Last 14 Days):                               │        │  │
│  │  │ ████████████ Oct 19: ₹5K (3.3K clicks)                     │        │  │
│  │  │ ██████████░░ Oct 18: ₹4.2K (2.8K clicks)                   │        │  │
│  │  └─────────────────────────────────────────────────────────────┘        │  │
│  │                              │                                           │  │
│  │                              │ API Call: GET /ad-dashboard/admin/overview│  │
│  │                              ▼                                           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘

                                       │
                                       │ HTTP/REST API
                                       │ Bearer Token Auth
                                       ▼

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  API LAYER                                       │
│                       (apps/api - Port 4000)                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  📡 API ROUTES (/routes/adDashboard.ts)                                         │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                           │  │
│  │  GET  /v1/ad-dashboard/vendor/summary                                    │  │
│  │       ↓                                                                   │  │
│  │       getVendorDashboardSummary(req, res, next)                          │  │
│  │       • Query: ?daysBack=30                                              │  │
│  │       • Auth: Vendor required (⚠️ TODO)                                  │  │
│  │       • Returns: summary, dailyStats, topCampaigns, budgetAnalysis       │  │
│  │                                                                           │  │
│  │  GET  /v1/ad-dashboard/vendor/comparison                                 │  │
│  │       ↓                                                                   │  │
│  │       getCampaignComparison(req, res, next)                              │  │
│  │       • Query: ?campaigns=id1,id2,id3                                    │  │
│  │       • Auth: Vendor required (⚠️ TODO)                                  │  │
│  │       • Returns: campaigns[] with metrics + timeline                     │  │
│  │                                                                           │  │
│  │  GET  /v1/ad-dashboard/admin/overview                                    │  │
│  │       ↓                                                                   │  │
│  │       getAdminDashboardOverview(req, res, next)                          │  │
│  │       • Query: ?daysBack=30                                              │  │
│  │       • Auth: Admin role required (⚠️ TODO middleware)                   │  │
│  │       • Returns: platformMetrics, dailyRevenue, topVendors, alerts      │  │
│  │                                                                           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  🧮 CONTROLLER LOGIC (/controllers/adDashboard.ts)                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                           │  │
│  │  getVendorDashboardSummary():                                            │  │
│  │  ┌─────────────────────────────────────────────────────────┐            │  │
│  │  │ 1. Parse query params (vendorId, daysBack)              │            │  │
│  │  │ 2. Query AdCampaign.find({ vendor: vendorId })          │            │  │
│  │  │ 3. Calculate summary stats:                             │            │  │
│  │  │    • totalImpressions = sum(campaign.impressions)       │            │  │
│  │  │    • totalClicks = sum(campaign.clicks)                 │            │  │
│  │  │    • totalSpent = sum(campaign.spentTotal)              │            │  │
│  │  │    • averageCTR = (clicks / impressions) * 100          │            │  │
│  │  │    • averageCPC = spent / clicks                        │            │  │
│  │  │ 4. Aggregate daily stats from AdClick collection        │            │  │
│  │  │ 5. Identify top 5 campaigns by CTR                      │            │  │
│  │  │ 6. Calculate budget analysis (total/spent/remaining)    │            │  │
│  │  │ 7. Return JSON response                                 │            │  │
│  │  └─────────────────────────────────────────────────────────┘            │  │
│  │                                                                           │  │
│  │  getAdminDashboardOverview():                                            │  │
│  │  ┌─────────────────────────────────────────────────────────┐            │  │
│  │  │ 1. Check req.user.role === 'admin' (403 if not)         │            │  │
│  │  │ 2. Aggregate platform-wide metrics:                     │            │  │
│  │  │    • totalRevenue from AdClick.aggregate($sum: cost)    │            │  │
│  │  │    • totalCampaigns/activeCampaigns count               │            │  │
│  │  │    • totalImpressions/Clicks from AdCampaign            │            │  │
│  │  │ 3. Aggregate daily revenue with date grouping           │            │  │
│  │  │ 4. Find top vendors by spend (with $lookup join)        │            │  │
│  │  │ 5. Calculate placement stats by grouping clicks         │            │  │
│  │  │ 6. Run fraud detection queries:                         │            │  │
│  │  │    • Suspicious: CTR < 0.5% AND clicks > 100            │            │  │
│  │  │    • High spend: spentTotal/totalBudget > 0.80          │            │  │
│  │  │ 7. Populate vendor details for alerts                   │            │  │
│  │  │ 8. Return JSON response                                 │            │  │
│  │  └─────────────────────────────────────────────────────────┘            │  │
│  │                                                                           │  │
│  │  getCampaignComparison():                                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐            │  │
│  │  │ 1. Parse campaignIds from query string                  │            │  │
│  │  │ 2. Query AdCampaign.find({ _id: { $in: ids } })         │            │  │
│  │  │ 3. For each campaign, aggregate AdClick timeline        │            │  │
│  │  │ 4. Calculate metrics (CTR, CPC, conversions)            │            │  │
│  │  │ 5. Return campaigns[] with metrics + timeline           │            │  │
│  │  └─────────────────────────────────────────────────────────┘            │  │
│  │                                                                           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘

                                       │
                                       │ MongoDB Queries
                                       │ Aggregation Pipelines
                                       ▼

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                DATABASE LAYER                                    │
│                         (MongoDB - Port 27017)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  📦 COLLECTIONS (from Feature #266)                                             │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                           │  │
│  │  AdCampaign Collection:                                                  │  │
│  │  {                                                                        │  │
│  │    _id: ObjectId,                                                        │  │
│  │    vendor: ObjectId → Vendor,                                            │  │
│  │    product: ObjectId → Product,                                          │  │
│  │    name: String,                                                         │  │
│  │    bidType: 'cpc' | 'cpm',                                              │  │
│  │    bidAmount: Number,                                                    │  │
│  │    dailyBudget: Number,                                                  │  │
│  │    totalBudget: Number,                                                  │  │
│  │    spentTotal: Number,         ← Used for budget analysis               │  │
│  │    spentToday: Number,         ← Used for daily tracking                │  │
│  │    status: String,             ← Used for filtering active campaigns    │  │
│  │    keywords: [String],                                                   │  │
│  │    placements: [String],                                                 │  │
│  │    impressions: Number,        ← Aggregated for summary                 │  │
│  │    clicks: Number,             ← Aggregated for summary                 │  │
│  │    conversions: Number,        ← Used for conversion tracking           │  │
│  │    startDate: Date,                                                      │  │
│  │    endDate: Date                                                         │  │
│  │  }                                                                        │  │
│  │  Indexes: vendor, status, startDate                                     │  │
│  │                                                                           │  │
│  │  AdClick Collection:                                                     │  │
│  │  {                                                                        │  │
│  │    _id: ObjectId,                                                        │  │
│  │    campaign: ObjectId → AdCampaign,                                      │  │
│  │    vendor: ObjectId → Vendor,   ← Used for top vendor aggregation       │  │
│  │    product: ObjectId → Product,                                          │  │
│  │    user: ObjectId?,                                                      │  │
│  │    sessionId: String,                                                    │  │
│  │    placement: String,           ← Used for placement stats              │  │
│  │    keyword: String?,                                                     │  │
│  │    cost: Number,                ← Aggregated for revenue                │  │
│  │    convertedToOrder: Boolean,   ← Used for conversion tracking          │  │
│  │    orderId: ObjectId?,                                                   │  │
│  │    clickedAt: Date,             ← Used for daily grouping               │  │
│  │    metadata: Object                                                      │  │
│  │  }                                                                        │  │
│  │  Indexes: campaign, vendor, clickedAt, placement                        │  │
│  │                                                                           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  🔍 AGGREGATION PIPELINES                                                       │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                           │  │
│  │  Daily Stats Aggregation (Vendor):                                       │  │
│  │  AdClick.aggregate([                                                     │  │
│  │    { $match: { vendor: vendorId, clickedAt: { $gte: startDate } } },    │  │
│  │    {                                                                     │  │
│  │      $group: {                                                           │  │
│  │        _id: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' }},│  │
│  │        clicks: { $sum: 1 },                                             │  │
│  │        cost: { $sum: '$cost' },                                         │  │
│  │        conversions: { $sum: { $cond: ['$convertedToOrder', 1, 0] } }   │  │
│  │      }                                                                   │  │
│  │    },                                                                    │  │
│  │    { $sort: { _id: 1 } }                                                │  │
│  │  ])                                                                      │  │
│  │                                                                           │  │
│  │  Top Vendors Aggregation (Admin):                                        │  │
│  │  AdClick.aggregate([                                                     │  │
│  │    {                                                                     │  │
│  │      $group: {                                                           │  │
│  │        _id: '$vendor',                                                   │  │
│  │        totalSpent: { $sum: '$cost' },                                   │  │
│  │        totalClicks: { $sum: 1 },                                        │  │
│  │        totalImpressions: { ... }                                        │  │
│  │      }                                                                   │  │
│  │    },                                                                    │  │
│  │    { $sort: { totalSpent: -1 } },                                       │  │
│  │    { $limit: 10 },                                                      │  │
│  │    {                                                                     │  │
│  │      $lookup: {                                                          │  │
│  │        from: 'vendors',                                                  │  │
│  │        localField: '_id',                                               │  │
│  │        foreignField: '_id',                                             │  │
│  │        as: 'vendorDetails'                                              │  │
│  │      }                                                                   │  │
│  │    },                                                                    │  │
│  │    { $unwind: '$vendorDetails' }                                        │  │
│  │  ])                                                                      │  │
│  │                                                                           │  │
│  │  Placement Stats Aggregation (Admin):                                    │  │
│  │  AdClick.aggregate([                                                     │  │
│  │    {                                                                     │  │
│  │      $group: {                                                           │  │
│  │        _id: '$placement',                                               │  │
│  │        clicks: { $sum: 1 },                                             │  │
│  │        revenue: { $sum: '$cost' },                                      │  │
│  │        conversions: { $sum: { $cond: ['$convertedToOrder', 1, 0] } }   │  │
│  │      }                                                                   │  │
│  │    }                                                                     │  │
│  │  ])                                                                      │  │
│  │                                                                           │  │
│  │  Fraud Detection Query (Suspicious Campaigns):                           │  │
│  │  AdCampaign.find({                                                       │  │
│  │    status: 'active',                                                    │  │
│  │    clicks: { $gt: 100 },                                                │  │
│  │    $expr: {                                                             │  │
│  │      $lt: [                                                             │  │
│  │        { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] }, │  │
│  │        0.5                                                              │  │
│  │      ]                                                                  │  │
│  │    }                                                                    │  │
│  │  }).populate('vendor', 'businessName email')                            │  │
│  │                                                                           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DATA FLOW SEQUENCE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  VENDOR DASHBOARD LOAD:                                                         │
│  ┌───────────┐      ┌──────────┐      ┌────────────┐      ┌──────────────┐    │
│  │  Browser  │─────>│  Next.js │─────>│  API Route │─────>│  Controller  │    │
│  │ campaigns │ GET  │   App    │ Auth │ adDashboard│Query │  Dashboard   │    │
│  │   page    │<─────│ (vendor) │Token │  /vendor/  │Params│   Logic      │    │
│  │ (index.tsx)│ JSON │          │      │  summary   │      │              │    │
│  └───────────┘      └──────────┘      └────────────┘      └───────┬──────┘    │
│                                                                     │            │
│                                                                     ▼            │
│                                        ┌────────────────────────────────────┐   │
│                                        │  MongoDB Queries:                  │   │
│                                        │  1. AdCampaign.find({ vendor })    │   │
│                                        │  2. AdClick.aggregate([...])       │   │
│                                        │  3. Calculate metrics              │   │
│                                        │  4. Return aggregated data         │   │
│                                        └────────────────────────────────────┘   │
│                                                                                  │
│  CAMPAIGN CREATION FLOW:                                                        │
│  ┌───────────┐      ┌──────────┐      ┌────────────┐      ┌──────────────┐    │
│  │  Browser  │─────>│  Wizard  │─────>│  Campaigns │─────>│   MongoDB    │    │
│  │create page│ POST │4-step form│ POST │ Controller │Insert│  AdCampaign  │    │
│  │(create.tsx)│Data │Validation │/v1/ │  Create    │      │  Collection  │    │
│  └───────────┘      │Step 1-4   │campaigns│ Campaign│      └──────────────┘    │
│                     └──────────┘      └────────────┘                            │
│                                                                                  │
│  ADMIN DASHBOARD LOAD:                                                          │
│  ┌───────────┐      ┌──────────┐      ┌────────────┐      ┌──────────────┐    │
│  │  Browser  │─────>│  Next.js │─────>│  API Route │─────>│  Controller  │    │
│  │advertising│ GET  │   App    │Admin │ adDashboard│Role  │   Admin      │    │
│  │ dashboard │<─────│  (admin) │Token │   /admin/  │Check │   Logic      │    │
│  │(dashboard  │ JSON │          │      │  overview  │403   │              │    │
│  │ .tsx)      │      └──────────┘      └────────────┘      └───────┬──────┘    │
│  └───────────┘                                                      │            │
│                                                                     ▼            │
│                                        ┌────────────────────────────────────┐   │
│                                        │  Platform-Wide Aggregations:       │   │
│                                        │  1. All AdCampaigns count          │   │
│                                        │  2. AdClick revenue aggregation    │   │
│                                        │  3. Top vendors by spend           │   │
│                                        │  4. Placement performance          │   │
│                                        │  5. Fraud detection queries        │   │
│                                        │  6. Return platform metrics        │   │
│                                        └────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY & AUTHORIZATION                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ⚠️ CURRENT STATE (TODO):                                                       │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ • Auth middleware NOT YET APPLIED to dashboard routes                    │  │
│  │ • Frontend uses localStorage.getItem('token') for Authorization header   │  │
│  │ • Admin role check EXISTS in controller logic (getAdminDashboardOverview)│  │
│  │ • Vendor isolation enforced via query filtering (vendor: vendorId)       │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ✅ TARGET STATE (To Implement):                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ import { authenticateToken, vendorOnly, adminOnly } from '../middleware'│  │
│  │                                                                           │  │
│  │ // Vendor routes                                                         │  │
│  │ router.get('/vendor/summary',                                            │  │
│  │   authenticateToken,          // Validates JWT, populates req.user      │  │
│  │   vendorOnly,                 // Ensures req.user.role === 'vendor'     │  │
│  │   getVendorDashboardSummary                                              │  │
│  │ );                                                                        │  │
│  │                                                                           │  │
│  │ // Admin routes                                                          │  │
│  │ router.get('/admin/overview',                                            │  │
│  │   authenticateToken,          // Validates JWT, populates req.user      │  │
│  │   adminOnly,                  // Ensures req.user.role === 'admin'      │  │
│  │   getAdminDashboardOverview                                              │  │
│  │ );                                                                        │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  🔒 DATA ISOLATION:                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ Vendors:                                                                  │  │
│  │ • Can only query own campaigns: AdCampaign.find({ vendor: req.user.id })│  │
│  │ • Cannot see other vendors' data                                         │  │
│  │ • Cannot access platform-wide metrics                                    │  │
│  │                                                                           │  │
│  │ Admins:                                                                   │  │
│  │ • Can query all campaigns across all vendors                             │  │
│  │ • See platform-wide aggregations                                         │  │
│  │ • Access to fraud detection alerts                                       │  │
│  │ • View PII (vendor emails) in alerts                                     │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                        KEY PERFORMANCE INDICATORS                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  📊 VENDOR METRICS:                                                             │
│  • Total Campaigns: Count of all campaigns for vendor                          │
│  • Active Campaigns: Campaigns with status='active'                            │
│  • Total Impressions: Sum of campaign.impressions                              │
│  • Total Clicks: Sum of campaign.clicks                                        │
│  • Average CTR: (totalClicks / totalImpressions) × 100                         │
│  • Average CPC: totalSpent / totalClicks                                       │
│  • Total Spent: Sum of campaign.spentTotal                                     │
│  • Budget Remaining: Sum of (totalBudget - spentTotal)                         │
│  • Daily Spent: campaign.spentToday aggregated                                 │
│                                                                                  │
│  📈 ADMIN METRICS:                                                              │
│  • Total Revenue: Sum of AdClick.cost (platform earnings)                      │
│  • Total Campaigns: Count of all AdCampaigns                                   │
│  • Active Campaigns: Count where status='active'                               │
│  • Total Impressions: Sum of all campaign.impressions                          │
│  • Total Clicks: Sum of all campaign.clicks                                    │
│  • Overall CTR: Platform-wide click-through rate                               │
│  • Avg Revenue/Click: totalRevenue / totalClicks                               │
│  • Top Vendors: Aggregated by total spent (top 10)                             │
│  • Placement Stats: Clicks, revenue, conversions by placement type             │
│                                                                                  │
│  🚨 FRAUD ALERTS:                                                               │
│  • Suspicious Campaigns: CTR < 0.5% AND clicks > 100                           │
│  • High Spend Campaigns: (spentTotal / totalBudget) > 80%                      │
└─────────────────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                               FILES CREATED/MODIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backend (3 files, ~570 lines):
  ✅ apps/api/src/controllers/adDashboard.ts           ~460 lines (3 endpoints)
  ✅ apps/api/src/routes/adDashboard.ts                ~25 lines (route defs)
  ✅ apps/api/src/routes/index.ts                      +2 lines (registration)

Frontend (3 files, ~1,150 lines):
  ✅ apps/vendor/pages/campaigns/index.tsx             ~415 lines (dashboard)
  ✅ apps/vendor/pages/campaigns/create.tsx            ~635 lines (wizard)
  ✅ apps/admin/pages/advertising/dashboard.tsx        ~330 lines (admin dash)

Documentation (3 files, ~1,550 lines):
  ✅ docs/AD_MANAGEMENT_DASHBOARD.md                   ~350 lines (full guide)
  ✅ docs/AD_MANAGEMENT_DASHBOARD_QUICK_REFERENCE.md   ~420 lines (cheat sheet)
  ✅ docs/FEATURE_267_IMPLEMENTATION_SUMMARY.md        ~780 lines (this summary)
  ✅ docs/FEATURE_267_ARCHITECTURE_DIAGRAM.md          ~??? lines (architecture)

TOTAL: 10 files, ~3,270+ lines of code + documentation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                                   STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature #267: Ad Management Dashboard
Status: ✅ 90% COMPLETE

Completed:
  ✅ Backend API controller (3 endpoints)
  ✅ API routes registered
  ✅ Vendor dashboard UI (metrics + campaign list)
  ✅ Vendor campaign creation wizard (4 steps)
  ✅ Admin advertising dashboard (analytics + fraud)
  ✅ Complete documentation suite

Pending:
  ⏳ Campaign detail view page (/campaigns/:id)
  ⏳ Campaign edit page (/campaigns/:id/edit)
  ⚠️ Apply auth middleware (HIGH PRIORITY - security)
  ❌ Comprehensive test suite

Next Steps:
  1. Create campaign detail page
  2. Create campaign edit page
  3. Apply auth middleware to all advertising routes
  4. Write test suite (unit + integration + E2E)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
