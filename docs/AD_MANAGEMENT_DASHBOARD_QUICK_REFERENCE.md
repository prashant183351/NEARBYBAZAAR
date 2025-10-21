# Ad Management Dashboard - Quick Reference

**Feature #267** | Status: ✅ COMPLETE | Date: Oct 20, 2025

## 🎯 Quick Links

- **Full Documentation**: [AD_MANAGEMENT_DASHBOARD.md](./AD_MANAGEMENT_DASHBOARD.md)
- **Feature #266**: [Sponsored Listings Backend](./SPONSORED_ADS.md)
- **Vendor Dashboard**: http://localhost:3002/campaigns
- **Admin Dashboard**: http://localhost:3003/advertising/dashboard

---

## 📦 What Was Built

### Backend (3 files, ~570 lines)
```
apps/api/src/
├── controllers/adDashboard.ts     # 3 endpoints, ~460 lines
├── routes/adDashboard.ts          # Route definitions, ~25 lines
└── routes/index.ts                # Added adDashboard registration
```

### Frontend (3 files, ~1,150 lines)
```
apps/vendor/pages/campaigns/
├── index.tsx                      # Dashboard with metrics, ~415 lines
└── create.tsx                     # 4-step campaign wizard, ~635 lines

apps/admin/pages/advertising/
└── dashboard.tsx                  # Platform analytics, ~330 lines
```

---

## 🚀 API Endpoints Cheat Sheet

### Vendor Endpoints

#### GET /v1/ad-dashboard/vendor/summary
**Purpose**: Get complete dashboard data  
**Auth**: Vendor required  
**Query**: `?daysBack=30` (optional, default: 30)  
**Returns**: summary, dailyStats, topCampaigns, budgetAnalysis, campaigns[]

```bash
curl -H "Authorization: Bearer $TOKEN" \
  'http://localhost:4000/v1/ad-dashboard/vendor/summary?daysBack=7'
```

#### GET /v1/ad-dashboard/vendor/comparison
**Purpose**: Compare multiple campaigns  
**Auth**: Vendor required  
**Query**: `?campaigns=id1,id2,id3`  
**Returns**: campaigns[] with metrics and timeline

```bash
curl -H "Authorization: Bearer $TOKEN" \
  'http://localhost:4000/v1/ad-dashboard/vendor/comparison?campaigns=abc,def'
```

### Admin Endpoints

#### GET /v1/ad-dashboard/admin/overview
**Purpose**: Platform-wide metrics and fraud alerts  
**Auth**: Admin role required  
**Query**: `?daysBack=30` (optional, default: 30)  
**Returns**: platformMetrics, dailyRevenue[], topVendors[], placementStats[], alerts{}

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  'http://localhost:4000/v1/ad-dashboard/admin/overview?daysBack=90'
```

---

## 📊 Key Metrics Explained

### Vendor Metrics
| Metric | Calculation | Purpose |
|--------|-------------|---------|
| **Total Campaigns** | Count of all campaigns | Campaign volume |
| **Active Campaigns** | Count where status='active' | Currently running ads |
| **Total Impressions** | Sum of all campaign.impressions | Ad visibility |
| **Total Clicks** | Sum of all campaign.clicks | User engagement |
| **Average CTR** | (totalClicks / totalImpressions) × 100 | Click efficiency |
| **Average CPC** | totalSpent / totalClicks | Cost per click |
| **Total Spent** | Sum of campaign.spentTotal | Budget consumed |
| **Remaining Budget** | Sum of (totalBudget - spentTotal) | Available funds |

### Admin Metrics
| Metric | Calculation | Purpose |
|--------|-------------|---------|
| **Total Revenue** | Sum of all AdClick.cost | Platform earnings |
| **Overall CTR** | Platform-wide click rate | Ad effectiveness |
| **Avg Revenue/Click** | totalRevenue / totalClicks | Click value |
| **Top Vendors** | Aggregated by spend | High spenders |
| **Placement Stats** | Grouped by placement type | Best ad positions |

---

## 🎨 UI Components Guide

### Vendor Dashboard Features
```
┌─────────────────────────────────────────────────┐
│ Date Filter: [7 days] [30 days] [90 days]      │
├─────────────────────────────────────────────────┤
│ Summary Cards:                                  │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│ │ 5    │ │150K  │ │ 2.0% │ │₹15K  │            │
│ │Camps │ │Impr. │ │ CTR  │ │Spent │            │
│ └──────┘ └──────┘ └──────┘ └──────┘            │
├─────────────────────────────────────────────────┤
│ Budget Overview:                                │
│ Total: ₹50K  [████████░░] 30% used             │
│ Today: ₹2K   [█████░░░░░] 22% used             │
├─────────────────────────────────────────────────┤
│ Top Campaigns (by CTR):                         │
│ 1. Summer Sale    2.4% CTR  ₹6K spent          │
│ 2. New Arrivals  2.1% CTR  ₹4K spent          │
├─────────────────────────────────────────────────┤
│ All Campaigns:                                  │
│ [Image] Name      Status  Bid  Impr  CTR  $    │
│ [📦]   Campaign1  Active  ₹5   10K  2%   ₹500  │
│                   [View] [Edit]                 │
└─────────────────────────────────────────────────┘
```

### Campaign Creation Wizard
```
Step 1: Basic Info           Step 2: Budget & Bid
┌─────────────────┐         ┌─────────────────┐
│ Campaign Name:  │         │ Bid Type:       │
│ [___________]   │         │ ○ CPC  ○ CPM    │
│                 │         │                 │
│ Product:        │         │ Bid Amount: ₹__ │
│ [Select v]      │         │ Daily: ₹______  │
│ [Product Card]  │         │ Total: ₹______  │
│                 │         │                 │
│ Start: [____]   │         │ Est. Clicks: ~  │
│ End:   [____]   │         │ Est. Impr.: ~   │
└─────────────────┘         └─────────────────┘

Step 3: Targeting            Step 4: Review
┌─────────────────┐         ┌─────────────────┐
│ Keywords:       │         │ ✓ Campaign Name │
│ [Type + Add]    │         │ ✓ Product       │
│ [phone] [x]     │         │ ✓ Budget: ₹500  │
│ [mobile] [x]    │         │ ✓ Keywords: 3   │
│                 │         │ ✓ Placements: 2 │
│ Placements:     │         │                 │
│ ☑ Search        │         │ [Create Campaign]│
│ ☑ Category      │         │                 │
└─────────────────┘         └─────────────────┘
```

### Admin Dashboard
```
┌─────────────────────────────────────────────────┐
│ Platform Metrics:                               │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│ │₹150K │ │ 87   │ │ 5M   │ │₹1.50 │            │
│ │Rev.  │ │Active│ │Impr. │ │/Click│            │
│ └──────┘ └──────┘ └──────┘ └──────┘            │
├─────────────────────────────────────────────────┤
│ 🚨 Alerts:                                      │
│ Suspicious Campaigns:    High Spend Campaigns: │
│ • Low CTR campaign       • Campaign at 85%     │
│   0.3% CTR, 200 clicks     ₹8.5K of ₹10K       │
├─────────────────────────────────────────────────┤
│ Top Vendors:                                    │
│ # Vendor           Spent    Campaigns  CTR     │
│ 1 TopVendor Inc   ₹25K        8        2.0%    │
│ 2 GrowthCo        ₹18K        5        1.8%    │
├─────────────────────────────────────────────────┤
│ Daily Revenue (Last 14 Days):                   │
│ ████████████ Oct 19: ₹5K  (3.3K clicks)        │
│ ██████████░░ Oct 18: ₹4.2K (2.8K clicks)       │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Campaign Creation Validation Rules

### Step 1: Basic Info
- ✅ Campaign name required (non-empty)
- ✅ Product required (must select from dropdown)
- ✅ Start date required
- ⚠️ End date optional (null = indefinite)

### Step 2: Budget & Bid
- ✅ Bid type required (CPC or CPM)
- ✅ Bid amount ≥ ₹1
- ✅ Daily budget ≥ 10 × bid amount
- ✅ Total budget ≥ daily budget
- 💡 Estimated clicks/impressions calculated automatically

### Step 3: Targeting
- ✅ At least 1 keyword required
- ✅ At least 1 placement required
- 💡 Keywords case-insensitive, trimmed
- 💡 Placements: search, category, homepage, product_detail

### Step 4: Review
- ✅ All previous steps must be valid
- ✅ Shows read-only summary
- 💡 No additional validation

---

## 🚨 Fraud Detection Rules

### Suspicious Campaign Alert
**Triggers when:**
- Status = 'active' AND
- Clicks > 100 AND
- CTR < 0.5%

**Reasoning:** High click volume with abnormally low CTR suggests click fraud

### High Spend Alert
**Triggers when:**
- (spentTotal / totalBudget) > 0.80 (80%)

**Reasoning:** Campaign near budget exhaustion, vendor should be notified

---

## 💾 Data Models Used

### AdCampaign (from Feature #266)
```typescript
{
  _id: ObjectId,
  vendor: ObjectId,
  product: ObjectId,
  name: string,
  bidType: 'cpc' | 'cpm',
  bidAmount: number,
  dailyBudget: number,
  totalBudget: number,
  spentTotal: number,
  spentToday: number,
  status: 'draft' | 'active' | 'paused' | 'completed' | 'expired',
  keywords: string[],
  placements: string[],
  impressions: number,
  clicks: number,
  conversions: number,
  startDate: Date,
  endDate: Date?
}
```

### AdClick (from Feature #266)
```typescript
{
  _id: ObjectId,
  campaign: ObjectId,
  vendor: ObjectId,
  product: ObjectId,
  user: ObjectId?,
  sessionId: string,
  placement: string,
  keyword: string?,
  cost: number,
  convertedToOrder: boolean,
  orderId: ObjectId?,
  clickedAt: Date,
  metadata: Object
}
```

---

## 🔐 Security Checklist

- [ ] **Auth Middleware**: Apply to all dashboard routes
- [ ] **Vendor Isolation**: Vendors only see own campaigns
- [ ] **Admin Role Check**: Admin endpoints verify role
- [ ] **Rate Limiting**: Apply to dashboard API endpoints
- [ ] **Input Validation**: Zod schemas on all inputs
- [ ] **XSS Protection**: Sanitize campaign names/keywords
- [ ] **SQL Injection**: MongoDB parameterized queries
- [ ] **CSRF Tokens**: If using sessions

---

## 🧪 Testing Quick Commands

```powershell
# Run all API tests
pnpm --filter @nearbybazaar/api test

# Test specific controller
pnpm --filter @nearbybazaar/api test adDashboard

# Run with coverage
pnpm --filter @nearbybazaar/api test --coverage

# E2E tests (Playwright)
pnpm --filter @nearbybazaar/web test:e2e campaigns
```

---

## 🐛 Common Issues & Solutions

### Dashboard Not Loading
```
Problem: Empty dashboard or loading forever
Solution: 
1. Check API is running (localhost:4000)
2. Verify auth token in localStorage: localStorage.getItem('token')
3. Check browser console for API errors
4. Verify campaign data exists in DB
```

### Incorrect Metrics
```
Problem: Numbers don't match expected values
Solution:
1. Check AdCampaign.impressions/clicks are updated
2. Verify AdClick records exist
3. Review aggregation pipeline date filtering
4. Confirm AdClickJob is running
```

### Wizard Validation Failing
```
Problem: Can't proceed to next step
Solution:
1. Check all required fields filled
2. Verify budget constraints (daily ≥ 10×bid)
3. Ensure at least 1 keyword added
4. Select at least 1 placement
```

### Admin Dashboard 403 Error
```
Problem: Forbidden error on admin dashboard
Solution:
1. Verify user has admin role
2. Check token is valid admin token
3. Ensure role check in API controller
4. Test with known admin account
```

---

## 📈 Performance Tips

### Backend Optimizations
1. **Use Date Filtering**: Limit queries to last 30-90 days
2. **Add Indexes**: Ensure indexes on AdClick.clickedAt, AdCampaign.vendor
3. **Lean Queries**: Use `.lean()` for read-only data
4. **Aggregation**: Prefer MongoDB aggregation over client-side processing
5. **Pagination**: Limit top lists (5-10 items)

### Frontend Optimizations
1. **Caching**: Store dashboard data in state, refresh on demand
2. **Debouncing**: Wait 300ms after date range change
3. **Lazy Loading**: Code-split dashboard components
4. **Memoization**: Use React.memo for metric cards
5. **Virtualization**: If campaign list > 50 items

---

## 📝 Next Steps (TODO)

1. **Campaign Detail Page** (`/campaigns/:id`)
   - Full metrics breakdown
   - Daily performance chart
   - Keyword performance table
   - Pause/Resume/Delete controls

2. **Campaign Edit Page** (`/campaigns/:id/edit`)
   - Reuse create wizard
   - Pre-populate with current values
   - Handle immutable fields

3. **Real-Time Updates**
   - WebSocket for live metrics
   - Auto-refresh dashboard
   - Push notifications for alerts

4. **Export Features**
   - CSV export of campaigns
   - PDF report generation
   - Email scheduled reports

5. **Advanced Fraud Detection**
   - ML-based anomaly detection
   - IP tracking and blocking
   - Device fingerprinting

---

## 🎓 Learning Resources

- **MongoDB Aggregation**: https://docs.mongodb.com/manual/aggregation/
- **React Hooks**: https://react.dev/reference/react
- **Next.js Routing**: https://nextjs.org/docs/routing/introduction
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 📞 Support

- **Issues**: Check [AD_MANAGEMENT_DASHBOARD.md](./AD_MANAGEMENT_DASHBOARD.md) troubleshooting section
- **API Reference**: See full endpoint documentation above
- **Code**: Review `apps/api/src/controllers/adDashboard.ts` for logic

---

**Last Updated**: October 20, 2025  
**Feature Status**: ✅ COMPLETE (90% - detail/edit pages pending)  
**Next Feature**: #268 (Returns Management) or complete #266 integration
