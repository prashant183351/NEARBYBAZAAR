# B2B Analytics Quick Reference

## Quick Start

### Access Dashboards

```bash
# Vendor Dashboard
http://localhost:3002/analytics/b2b

# Admin Dashboard
http://localhost:3003/analytics/b2b
```

### API Endpoints

```bash
# Vendor Analytics
GET /v1/analytics/vendor/b2b/summary?vendorId=VENDOR_ID
GET /v1/analytics/vendor/b2b/trends?vendorId=VENDOR_ID&days=30
GET /v1/analytics/vendor/b2b/export?vendorId=VENDOR_ID&format=csv

# Admin Analytics
GET /v1/analytics/admin/b2b/breakdown
GET /v1/analytics/admin/b2b/export?format=csv
GET /v1/analytics/admin/b2b/regions
GET /v1/analytics/admin/b2b/industries
```

---

## Key Metrics Cheat Sheet

| Metric | What It Means | Good Value |
|--------|---------------|------------|
| **Bulk vs Retail Ratio** | % of revenue from bulk orders | >50% for wholesale focus |
| **Avg Bulk Order Value** | Average bulk order size | 10-20x retail average |
| **Regional Revenue** | Revenue by geographic region | Balanced distribution |
| **Industry Concentration** | Top industries buying bulk | Diversified or focused |
| **Order Type Split** | Wholesale vs RFQ vs Contract | Track conversion patterns |

---

## Order Model B2B Fields

```typescript
{
  isBulkOrder: true,              // Required: Flag as bulk
  bulkOrderType: 'wholesale',     // wholesale | rfq | contract | custom
  businessAccount: true,          // Is B2B buyer account
  industry: 'manufacturing',      // Buyer's industry
  region: 'north'                 // Geographic region
}
```

---

## Dashboard Features

### Vendor Dashboard
✅ Bulk vs retail revenue comparison  
✅ Average order value comparison  
✅ Top bulk order type, industry, region  
✅ 30-day trend chart (bar chart)  
✅ CSV/JSON export with filters  

### Admin Dashboard
✅ Platform-wide B2B metrics  
✅ Regional breakdown (table)  
✅ Industry breakdown (table)  
✅ Order type breakdown (cards)  
✅ 30-day trend chart  
✅ Export with region/industry filters  

---

## Export CSV Columns

```
Order ID | Date | Buyer Name | Company | Industry | Region | Order Type
Subtotal | Tax | Total | Payment Status | Paid | Outstanding | Credit | Due Date
```

**Example:**
```csv
"67156abc123","2024-10-15","Rajesh Kumar","Kumar Mfg","manufacturing","north","wholesale","45000.00","8100.00","53100.00","partial","25000.00","28100.00","0.00","2024-11-14"
```

---

## Common Queries

### Get Vendor Summary

```bash
curl "http://localhost:5000/v1/analytics/vendor/b2b/summary?vendorId=vendor123&startDate=2024-04-20&endDate=2024-10-20"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBulkRevenue": 1500000,
    "totalRetailRevenue": 800000,
    "bulkVsRetailRatio": 65.2,
    "averageBulkOrderValue": 33333,
    "topIndustry": "manufacturing",
    "topRegion": "north"
  }
}
```

### Get Regional Breakdown

```bash
curl "http://localhost:5000/v1/analytics/admin/b2b/breakdown?startDate=2024-04-20&endDate=2024-10-20"
```

**Response includes:**
- `byRegion[]`: Array of regional stats
- `byIndustry[]`: Array of industry stats
- `byBulkOrderType[]`: Order type breakdown
- `recentTrends[]`: 30 days of daily data

### Export with Filters

```bash
# Vendor export
curl "http://localhost:5000/v1/analytics/vendor/b2b/export?vendorId=vendor123&format=csv" -o export.csv

# Admin export (filtered)
curl "http://localhost:5000/v1/analytics/admin/b2b/export?region=north&industry=manufacturing&format=csv" -o export.csv
```

---

## Integration Points

### With Payment Terms (#242)
- Export includes `creditUsed`, `outstandingAmount`, `paidAmount`
- Payment status tracked: unpaid/partial/paid/overdue
- Due dates included for credit term orders

### With B2B Accounts (#240)
- `businessAccount` flag differentiates B2B from retail
- `industry` from buyer company profile
- `region` from buyer primary address

### With RFQ System (#238)
- RFQ orders tagged as `bulkOrderType: 'rfq'`
- Track RFQ conversion to orders
- Include in analytics automatically

---

## Troubleshooting

### No Data in Dashboard
✅ Check orders have `isBulkOrder: true`  
✅ Verify date range includes bulk orders  
✅ Check browser console for API errors  

### Export File Empty
✅ Verify query parameters  
✅ Check if orders exist for filters  
✅ Test endpoint with curl/Postman  

### Missing Regional Data
✅ Ensure orders have `region` field  
✅ Update order creation to capture region  
✅ Backfill existing orders  

### Trends Chart Not Showing
✅ Check trends API returns data  
✅ Verify date format (YYYY-MM-DD)  
✅ Check CSS height on chart container  

---

## Testing Checklist

- [ ] Create sample bulk orders (isBulkOrder=true)
- [ ] Set varied bulkOrderType (wholesale, rfq, contract)
- [ ] Add industry and region to orders
- [ ] Test vendor summary endpoint
- [ ] Test admin breakdown endpoint
- [ ] Test CSV export (vendor)
- [ ] Test CSV export (admin with filters)
- [ ] Test date range filtering
- [ ] Verify trends chart renders
- [ ] Test export downloads correctly

---

## Security Notes

⚠️ **Access Control**:
- Vendor endpoints: Require vendor auth (replace VENDOR_ID placeholder)
- Admin endpoints: Require admin role (add RBAC middleware)

⚠️ **Rate Limiting**:
- Apply rate limits to export endpoints
- Consider daily export quotas for large vendors

⚠️ **Data Privacy**:
- Buyer names in exports for accounting only
- Serve exports over HTTPS only
- Consider auto-deletion of exports after 30 days

---

## Performance Tips

1. **Date Range**: Limit to 6-12 months for large datasets
2. **Caching**: Cache summary stats (Redis, 1-hour TTL)
3. **Indexes**: Ensure all B2B fields are indexed
4. **Pagination**: Add pagination for exports >10K records
5. **Aggregation**: Use MongoDB aggregation pipeline for vendors with 100K+ orders

---

## File Locations

```
apps/api/src/
  ├── services/analytics/b2bAnalytics.ts  # Analytics service
  ├── routes/analytics.ts                 # API endpoints
  └── models/Order.ts                     # Extended with B2B fields

apps/vendor/pages/analytics/
  └── b2b.tsx                             # Vendor dashboard

apps/admin/pages/analytics/
  └── b2b.tsx                             # Admin dashboard

docs/
  ├── B2B_ANALYTICS.md                    # Full documentation
  └── B2B_ANALYTICS_QUICK_REFERENCE.md    # This file
```

---

## Formula Reference

```typescript
// Bulk vs Retail Ratio
bulkVsRetailRatio = (totalBulkRevenue / (totalBulkRevenue + totalRetailRevenue)) * 100

// Average Order Value
averageOrderValue = totalRevenue / orderCount

// Utilization (for charts)
barHeight = (value / maxValue) * 100 + '%'
```

---

## Next Steps

1. **Add Auth**: Replace VENDOR_ID/ADMIN_ID placeholders with actual auth
2. **Add Caching**: Implement Redis caching for summary endpoints
3. **Add Tests**: Write integration tests for analytics functions
4. **Add Alerts**: Email reports for significant B2B growth/decline
5. **Add Forecasting**: Predict next month's B2B revenue

---

**Need Help?**

📘 Full Documentation: [B2B_ANALYTICS.md](./B2B_ANALYTICS.md)  
📧 Support: dev-team@nearbybazaar.com  
🐛 Report Issues: GitHub Issues  
