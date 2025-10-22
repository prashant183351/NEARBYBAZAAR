# B2B Analytics & Reports

## Overview

Feature #244 provides comprehensive analytics and reporting capabilities for bulk/wholesale orders, enabling vendors to track their B2B sales performance and admins to analyze platform-wide B2B activity by region, industry, and order type.

### Key Features

- **Vendor Analytics**: Track bulk vs retail revenue, average order values, and top-performing segments
- **Admin Analytics**: Platform-wide breakdowns by region, industry, and bulk order types
- **Export Functionality**: CSV and JSON exports for accounting reconciliation
- **Trend Analysis**: 30-day trend charts for visualizing B2B growth
- **Filters**: Region and industry filters for targeted analysis

---

## Database Schema

### Extended Order Model

The Order model has been enhanced with B2B-specific fields:

```typescript
{
  // B2B flags
  isBulkOrder: Boolean,           // Flag indicating bulk/wholesale order
  bulkOrderType: String,          // 'wholesale', 'rfq', 'contract', 'custom'
  businessAccount: Boolean,       // Is buyer a business account
  industry: String,               // Buyer's industry (for analytics)
  region: String,                 // Geographic region (for analytics)

  // Existing payment terms, credit, etc.
  paymentTerms: {...},
  creditUsed: Number,
  outstandingAmount: Number,
  paidAmount: Number,
  paymentStatus: String
}
```

**Indexes**: `isBulkOrder`, `bulkOrderType`, `businessAccount`, `industry`, `region`

---

## Analytics Service

### File: `apps/api/src/services/analytics/b2bAnalytics.ts`

Provides core analytics calculation functions:

#### Key Functions

1. **`getVendorB2BSummary(vendorId, startDate?, endDate?)`**
   - Returns vendor's bulk vs retail comparison
   - Calculates average order values
   - Identifies top bulk order type, industry, and region

   ```typescript
   {
     vendorId: string;
     totalBulkRevenue: number;
     totalRetailRevenue: number;
     bulkOrderCount: number;
     retailOrderCount: number;
     averageBulkOrderValue: number;
     averageRetailOrderValue: number;
     bulkVsRetailRatio: number; // percentage
     topBulkOrderType: string | null;
     topIndustry: string | null;
     topRegion: string | null;
     periodStart: Date;
     periodEnd: Date;
   }
   ```

2. **`getAdminB2BBreakdown(startDate?, endDate?)`**
   - Platform-wide B2B metrics
   - Regional breakdown with top industries per region
   - Industry breakdown with top regions per industry
   - Bulk order type analysis
   - 30-day trend data

   ```typescript
   {
     totalBulkRevenue: number;
     totalBulkOrders: number;
     averageBulkOrderValue: number;
     byRegion: RegionalStats[];
     byIndustry: IndustryStats[];
     byBulkOrderType: BulkTypeStats[];
     topVendors: VendorStats[];
     recentTrends: TrendData[];
     periodStart: Date;
     periodEnd: Date;
   }
   ```

3. **`getVendorB2BExport(vendorId, startDate?, endDate?)`**
   - Export vendor's bulk orders with full details
   - Includes buyer info, payment status, credit data
   - Returns array of ExportData objects

4. **`getAdminB2BExport(startDate?, endDate?, region?, industry?)`**
   - Export platform-wide bulk orders
   - Optional filters for region and industry
   - Comprehensive accounting reconciliation data

5. **`exportDataToCSV(data: ExportData[])`**
   - Converts export data to CSV format
   - Includes all order and payment details

6. **`getVendorB2BTrends(vendorId, days?)`**
   - Daily trend data for charts
   - Default: 30 days

---

## API Endpoints

### File: `apps/api/src/routes/analytics.ts`

All endpoints are prefixed with `/v1/analytics/`

### Vendor Endpoints

#### **GET /vendor/b2b/summary**

Get vendor's B2B sales summary.

**Query Parameters:**

- `vendorId` (required): Vendor ID
- `startDate` (optional): ISO date string (default: 6 months ago)
- `endDate` (optional): ISO date string (default: today)

**Response:**

```json
{
  "success": true,
  "data": {
    "vendorId": "vendor123",
    "totalBulkRevenue": 1500000,
    "totalRetailRevenue": 800000,
    "bulkOrderCount": 45,
    "retailOrderCount": 320,
    "averageBulkOrderValue": 33333,
    "averageRetailOrderValue": 2500,
    "bulkVsRetailRatio": 65.2,
    "topBulkOrderType": "wholesale",
    "topIndustry": "manufacturing",
    "topRegion": "north",
    "periodStart": "2024-04-20T00:00:00.000Z",
    "periodEnd": "2024-10-20T23:59:59.999Z"
  }
}
```

#### **GET /vendor/b2b/trends**

Get daily trend data for charts.

**Query Parameters:**

- `vendorId` (required): Vendor ID
- `days` (optional): Number of days (default: 30)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-10-01",
      "orderCount": 2,
      "revenue": 45000
    }
    // ... more days
  ]
}
```

#### **GET /vendor/b2b/export**

Export vendor's bulk orders.

**Query Parameters:**

- `vendorId` (required): Vendor ID
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `format` (optional): 'csv' or 'json' (default: 'csv')

**Response:**

- CSV: Downloads file with `Content-Type: text/csv`
- JSON: Returns `{ success: true, data: [...], count: N }`

**CSV Columns:**
Order ID, Date, Buyer Name, Company, Industry, Region, Order Type, Subtotal, Tax, Total, Payment Status, Paid Amount, Outstanding, Credit Used, Due Date

### Admin Endpoints

#### **GET /admin/b2b/breakdown**

Get platform-wide B2B analytics (admin only).

**Query Parameters:**

- `startDate` (optional): ISO date string (default: 6 months ago)
- `endDate` (optional): ISO date string (default: today)

**Response:**

```json
{
  "success": true,
  "data": {
    "totalBulkRevenue": 12500000,
    "totalBulkOrders": 523,
    "averageBulkOrderValue": 23900,
    "byRegion": [
      {
        "region": "north",
        "orderCount": 234,
        "revenue": 5600000,
        "averageOrderValue": 23932,
        "topIndustries": ["manufacturing", "retail", "services"]
      }
      // ... more regions
    ],
    "byIndustry": [
      {
        "industry": "manufacturing",
        "orderCount": 156,
        "revenue": 4200000,
        "averageOrderValue": 26923,
        "topRegions": ["north", "west", "south"]
      }
      // ... more industries
    ],
    "byBulkOrderType": [
      {
        "type": "wholesale",
        "orderCount": 312,
        "revenue": 7800000,
        "averageOrderValue": 25000
      }
      // ... more types
    ],
    "topVendors": [],
    "recentTrends": [
      // 30 days of trend data
    ],
    "periodStart": "2024-04-20T00:00:00.000Z",
    "periodEnd": "2024-10-20T23:59:59.999Z"
  }
}
```

#### **GET /admin/b2b/export**

Export platform-wide bulk orders (admin only).

**Query Parameters:**

- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `region` (optional): Filter by specific region
- `industry` (optional): Filter by specific industry
- `format` (optional): 'csv' or 'json' (default: 'csv')

**Response:**
Same format as vendor export endpoint but includes all platform orders.

#### **GET /admin/b2b/regions**

Get list of all regions with B2B activity.

**Response:**

```json
{
  "success": true,
  "data": ["north", "south", "east", "west", "central"]
}
```

#### **GET /admin/b2b/industries**

Get list of all industries with B2B activity.

**Response:**

```json
{
  "success": true,
  "data": ["manufacturing", "retail", "services", "healthcare", "technology"]
}
```

---

## Vendor Dashboard

### File: `apps/vendor/pages/analytics/b2b.tsx`

A comprehensive B2B analytics dashboard for vendors.

### Features

1. **Date Range Selector**: Filter data by custom date range
2. **Summary Cards**:
   - Bulk revenue and order count
   - Retail revenue and order count
   - Average bulk order value vs retail
   - Bulk vs retail revenue ratio (%)
3. **Key Insights**: Top bulk order type, industry, and region
4. **30-Day Trends Chart**: Visual bar chart of daily bulk revenue
5. **Export Section**: Download data as CSV or JSON

### Usage

```typescript
// Navigate to vendor dashboard
//localhost:3002/analytics/b2b

// Date range is applied via state
http: const [dateRange, setDateRange] = useState({
  startDate: '2024-04-20',
  endDate: '2024-10-20',
});

// Export handlers
handleExport('csv'); // Downloads CSV file
handleExport('json'); // Downloads JSON file
```

### Key Metrics Explained

- **Bulk vs Retail Ratio**: Percentage of total revenue from bulk orders
  - Formula: `(totalBulkRevenue / (totalBulkRevenue + totalRetailRevenue)) * 100`
  - Example: 65.2% means bulk orders account for 65.2% of revenue

- **Average Order Value**: Total revenue divided by order count
  - Helps identify pricing effectiveness
  - Compare bulk vs retail to validate volume discount strategy

---

## Admin Dashboard

### File: `apps/admin/pages/analytics/b2b.tsx`

Platform-wide B2B analytics with multiple views.

### Features

1. **Date Range Selector**: Filter platform data by date range
2. **Summary Cards**:
   - Total B2B revenue
   - Total B2B orders
   - Platform-wide average order value
3. **Tabbed Views**:
   - **Overview**: 30-day trend chart
   - **By Region**: Table breakdown by region with top industries
   - **By Industry**: Table breakdown by industry with top regions
   - **By Order Type**: Cards showing wholesale, RFQ, contract, custom stats
4. **Export Section**: Filter by region/industry and download CSV or JSON

### Usage

```typescript
// Navigate to admin dashboard
//localhost:3003/analytics/b2b

// Tab navigation
http: setActiveTab('overview'); // Trends chart
setActiveTab('regional'); // Regional breakdown table
setActiveTab('industry'); // Industry breakdown table
setActiveTab('types'); // Order type cards

// Export with filters
setExportFilters({ region: 'north', industry: 'manufacturing' });
handleExport('csv');
```

### Insights

- **Regional Analysis**: Identify which regions drive B2B growth
- **Industry Analysis**: Understand which industries buy bulk
- **Cross-Analysis**: See top industries per region and vice versa
- **Order Type Trends**: Track wholesale vs RFQ vs contract orders

---

## CSV Export Format

### Columns

| Column         | Description                      |
| -------------- | -------------------------------- |
| Order ID       | Unique order identifier          |
| Date           | Order creation date (YYYY-MM-DD) |
| Buyer Name     | Customer name                    |
| Company        | Business name (if B2B account)   |
| Industry       | Buyer's industry classification  |
| Region         | Geographic region                |
| Order Type     | wholesale/rfq/contract/custom    |
| Subtotal       | Order subtotal before tax        |
| Tax            | Tax amount (GST breakdown)       |
| Total          | Final order total                |
| Payment Status | unpaid/partial/paid/overdue      |
| Paid Amount    | Amount paid to date              |
| Outstanding    | Remaining unpaid amount          |
| Credit Used    | Credit allocated for this order  |
| Due Date       | Payment due date (if applicable) |

### Example CSV

```csv
"Order ID","Date","Buyer Name","Company","Industry","Region","Order Type","Subtotal","Tax","Total","Payment Status","Paid Amount","Outstanding","Credit Used","Due Date"
"67156abc123","2024-10-15","Rajesh Kumar","Kumar Manufacturing","manufacturing","north","wholesale","45000.00","8100.00","53100.00","partial","25000.00","28100.00","0.00","2024-11-14"
"67156def456","2024-10-14","Priya Sharma","Sharma Retail Chain","retail","west","wholesale","120000.00","21600.00","141600.00","paid","141600.00","0.00","50000.00",""
```

---

## Integration with Other Features

### With Payment Terms (#242)

- Export includes `creditUsed`, `outstandingAmount`, `paidAmount`
- Analytics considers payment status for revenue recognition
- Due dates included for credit term orders

### With B2B Buyer Accounts (#240)

- `businessAccount` flag differentiates B2B from retail
- `industry` field populated from buyer's company profile
- `region` inferred from buyer's primary address

### With RFQ System (#238)

- Orders from RFQs tagged with `bulkOrderType: 'rfq'`
- RFQ-generated orders included in analytics
- Track conversion rate (future enhancement)

### With GST Invoicing (#241)

- Tax amounts in exports match GST invoice data
- Compatible with GST filing requirements
- Industry and region for tax jurisdiction analysis

---

## Performance Considerations

### Database Queries

All analytics queries use indexed fields:

- `isBulkOrder` (Boolean index)
- `bulkOrderType` (String index)
- `industry` (String index)
- `region` (String index)
- `createdAt` (Date range queries)

### Optimization Tips

1. **Date Range**: Limit to 6-12 months for large datasets
2. **Caching**: Consider Redis caching for summary stats (daily refresh)
3. **Aggregation**: Use MongoDB aggregation pipeline for large vendor datasets
4. **Export Limits**: Add pagination for exports >10,000 records

---

## Testing

### Manual Testing Scenarios

1. **Vendor Summary**:

   ```bash
   curl "http://localhost:5000/v1/analytics/vendor/b2b/summary?vendorId=VENDOR_ID&startDate=2024-04-20&endDate=2024-10-20"
   ```

2. **Admin Breakdown**:

   ```bash
   curl "http://localhost:5000/v1/analytics/admin/b2b/breakdown?startDate=2024-04-20&endDate=2024-10-20"
   ```

3. **Export CSV**:

   ```bash
   curl "http://localhost:5000/v1/analytics/vendor/b2b/export?vendorId=VENDOR_ID&format=csv" -o export.csv
   ```

4. **Regional Filter**:
   ```bash
   curl "http://localhost:5000/v1/analytics/admin/b2b/export?region=north&format=json"
   ```

### Test Data Setup

Create sample bulk orders with varied:

- `isBulkOrder: true`
- `bulkOrderType`: wholesale, rfq, contract
- `industry`: manufacturing, retail, services
- `region`: north, south, east, west
- Date ranges over past 6 months

### Integration Tests

```typescript
// Test vendor summary calculation
it('should calculate bulk vs retail ratio correctly', async () => {
  const summary = await getVendorB2BSummary('vendor123');
  expect(summary.bulkVsRetailRatio).toBeLessThanOrEqual(100);
  expect(summary.bulkVsRetailRatio).toBeGreaterThanOrEqual(0);
});

// Test regional breakdown
it('should group orders by region', async () => {
  const breakdown = await getAdminB2BBreakdown();
  expect(breakdown.byRegion.length).toBeGreaterThan(0);
  expect(breakdown.byRegion[0]).toHaveProperty('region');
  expect(breakdown.byRegion[0]).toHaveProperty('revenue');
});

// Test export data structure
it('should format export data correctly', async () => {
  const data = await getVendorB2BExport('vendor123');
  expect(data[0]).toHaveProperty('orderId');
  expect(data[0]).toHaveProperty('total');
  expect(data[0]).toHaveProperty('paymentStatus');
});
```

---

## Security & Compliance

### Access Control

- **Vendor Endpoints**: Require vendor authentication (replace `VENDOR_ID` placeholder)
- **Admin Endpoints**: Require admin role (add RBAC middleware)
- **Export Limits**: Rate limit export endpoints to prevent abuse

### Data Privacy

- Buyer names included in exports for accounting purposes
- Ensure exports are served over HTTPS
- Consider masking buyer personal info if not necessary for reconciliation

### GDPR/DPDP Compliance

- Export functionality supports data portability requirements
- Buyers can request their B2B order history via vendor
- Implement data retention policies (e.g., auto-delete exports after 30 days)

---

## Future Enhancements

1. **Advanced Filtering**: Add product category, price range filters
2. **Forecasting**: Predict next month's B2B revenue based on trends
3. **Vendor Comparison**: Benchmark vendor performance against category averages
4. **Email Reports**: Automated weekly/monthly B2B reports via email
5. **Excel Export**: Native .xlsx format with multiple sheets
6. **Dashboard Widgets**: Embeddable charts for vendor storefronts
7. **Real-time Updates**: WebSocket-based live dashboard updates
8. **Commission Analysis**: B2B commission vs retail commission comparison

---

## Troubleshooting

### Issue: "No data showing in vendor dashboard"

**Solution**:

- Verify orders have `isBulkOrder: true` flag
- Check date range is correct
- Ensure vendor has bulk orders in the period
- Check browser console for API errors

### Issue: "Export file is empty"

**Solution**:

- Verify query parameters are correct
- Check if orders exist for filters applied
- Ensure API route is returning data (check network tab)
- Verify format parameter is 'csv' or 'json'

### Issue: "Regional breakdown shows 'Unknown'"

**Solution**:

- Orders missing `region` field
- Update order creation flow to capture region from buyer address
- Backfill existing orders with region data

### Issue: "Trends chart not rendering"

**Solution**:

- Check if trends API returns data
- Verify date format is correct (YYYY-MM-DD)
- Ensure CSS height is set on chart container
- Check for JavaScript errors in console

---

## Configuration

### Environment Variables

```env
# Optional: Default date range for analytics (days)
B2B_ANALYTICS_DEFAULT_DAYS=180

# Optional: Max export records per request
B2B_EXPORT_MAX_RECORDS=50000

# Optional: Enable caching for summary stats
B2B_ANALYTICS_CACHE_TTL=3600
```

### Feature Flags

```typescript
// apps/api/src/config/index.ts
export const config = {
  b2bAnalytics: {
    enableCache: process.env.B2B_ANALYTICS_CACHE === 'true',
    defaultDays: parseInt(process.env.B2B_ANALYTICS_DEFAULT_DAYS || '180'),
    exportMaxRecords: parseInt(process.env.B2B_EXPORT_MAX_RECORDS || '50000'),
  },
};
```

---

## File Summary

### New Files Created

1. `apps/api/src/services/analytics/b2bAnalytics.ts` (~450 lines)
2. `apps/vendor/pages/analytics/b2b.tsx` (~380 lines)
3. `apps/admin/pages/analytics/b2b.tsx` (~550 lines)

### Modified Files

1. `apps/api/src/models/Order.ts` (added B2B fields)
2. `apps/api/src/routes/analytics.ts` (added 7 B2B endpoints)

### Dependencies Added

- `date-fns` (for date manipulation in analytics service)

---

## Quick Reference

### Key Metrics

| Metric                 | Description                      | Formula                                    |
| ---------------------- | -------------------------------- | ------------------------------------------ |
| Bulk Revenue           | Total revenue from bulk orders   | Sum of order.total where isBulkOrder=true  |
| Retail Revenue         | Total revenue from retail orders | Sum of order.total where isBulkOrder=false |
| Bulk vs Retail Ratio   | % of revenue from bulk           | (bulkRevenue / totalRevenue) \* 100        |
| Avg Bulk Order Value   | Average bulk order size          | bulkRevenue / bulkOrderCount               |
| Avg Retail Order Value | Average retail order size        | retailRevenue / retailOrderCount           |

### API Quick Reference

```bash
# Vendor summary
GET /v1/analytics/vendor/b2b/summary?vendorId=X&startDate=Y&endDate=Z

# Vendor trends
GET /v1/analytics/vendor/b2b/trends?vendorId=X&days=30

# Vendor export
GET /v1/analytics/vendor/b2b/export?vendorId=X&format=csv

# Admin breakdown
GET /v1/analytics/admin/b2b/breakdown?startDate=Y&endDate=Z

# Admin export (filtered)
GET /v1/analytics/admin/b2b/export?region=north&industry=manufacturing&format=csv

# Get filter options
GET /v1/analytics/admin/b2b/regions
GET /v1/analytics/admin/b2b/industries
```

### Order Flags

```typescript
// Mark an order as B2B
order.isBulkOrder = true;
order.bulkOrderType = 'wholesale'; // or 'rfq', 'contract', 'custom'
order.businessAccount = true;
order.industry = 'manufacturing';
order.region = 'north';
```

---

## Support

For issues or questions:

- Check troubleshooting section above
- Review API responses in browser network tab
- Enable debug logs: `LOG_LEVEL=debug`
- Contact: dev-team@nearbybazaar.com

---

**Feature #244 Implementation Complete**

- Vendor analytics dashboard ✅
- Admin platform-wide analytics ✅
- CSV/JSON export functionality ✅
- Regional and industry breakdowns ✅
- 30-day trend charts ✅
- Documentation complete ✅
