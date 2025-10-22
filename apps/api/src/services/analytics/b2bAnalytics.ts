/**
 * B2B Analytics Service
 * Provides analytics for bulk/wholesale orders, regional breakdowns, industry analysis
 */

import { Order } from '../../models/Order';
// ...existing code...
import { startOfDay, endOfDay, subDays, subMonths } from 'date-fns';

export interface VendorB2BSummary {
  vendorId: string;
  totalBulkRevenue: number;
  totalRetailRevenue: number;
  bulkOrderCount: number;
  retailOrderCount: number;
  averageBulkOrderValue: number;
  averageRetailOrderValue: number;
  bulkVsRetailRatio: number; // percentage of revenue from bulk
  topBulkOrderType: string | null;
  topIndustry: string | null;
  topRegion: string | null;
  periodStart: Date;
  periodEnd: Date;
}

export interface AdminB2BBreakdown {
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

export interface RegionalStats {
  region: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
  topIndustries: string[];
}

export interface IndustryStats {
  industry: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
  topRegions: string[];
}

export interface BulkTypeStats {
  type: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

export interface VendorStats {
  vendorId: string;
  vendorName: string;
  bulkRevenue: number;
  bulkOrderCount: number;
  averageOrderValue: number;
}

export interface TrendData {
  date: string;
  orderCount: number;
  revenue: number;
}

export interface ExportData {
  orderId: string;
  date: string;
  buyerName: string;
  buyerCompany?: string;
  industry?: string;
  region?: string;
  orderType: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: string;
  paidAmount: number;
  outstandingAmount: number;
  creditUsed: number;
  dueDate?: string;
}

/**
 * Get vendor's B2B analytics summary
 */
export async function getVendorB2BSummary(
  vendorId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<VendorB2BSummary> {
  const start = startDate || subMonths(new Date(), 6);
  const end = endDate || new Date();

  // Get all orders for this vendor in the period
  const orders = await Order.find({
    vendor: vendorId,
    createdAt: { $gte: start, $lte: end },
    deleted: false,
    status: { $ne: 'cancelled' },
  }).populate('items.product');

  // Separate bulk and retail
  const bulkOrders = orders.filter((o) => o.isBulkOrder);
  const retailOrders = orders.filter((o) => !o.isBulkOrder);

  const totalBulkRevenue = bulkOrders.reduce((sum, o) => sum + o.total, 0);
  const totalRetailRevenue = retailOrders.reduce((sum, o) => sum + o.total, 0);

  const averageBulkOrderValue = bulkOrders.length > 0 ? totalBulkRevenue / bulkOrders.length : 0;
  const averageRetailOrderValue =
    retailOrders.length > 0 ? totalRetailRevenue / retailOrders.length : 0;

  const totalRevenue = totalBulkRevenue + totalRetailRevenue;
  const bulkVsRetailRatio = totalRevenue > 0 ? (totalBulkRevenue / totalRevenue) * 100 : 0;

  // Find top bulk order type
  const bulkTypeCounts: Record<string, number> = {};
  bulkOrders.forEach((o) => {
    if (o.bulkOrderType) {
      bulkTypeCounts[o.bulkOrderType] = (bulkTypeCounts[o.bulkOrderType] || 0) + 1;
    }
  });
  const topBulkOrderType =
    Object.keys(bulkTypeCounts).length > 0
      ? Object.entries(bulkTypeCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  // Find top industry
  const industryCounts: Record<string, number> = {};
  bulkOrders.forEach((o) => {
    if (o.industry) {
      industryCounts[o.industry] = (industryCounts[o.industry] || 0) + 1;
    }
  });
  const topIndustry =
    Object.keys(industryCounts).length > 0
      ? Object.entries(industryCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  // Find top region
  const regionCounts: Record<string, number> = {};
  bulkOrders.forEach((o) => {
    if (o.region) {
      regionCounts[o.region] = (regionCounts[o.region] || 0) + 1;
    }
  });
  const topRegion =
    Object.keys(regionCounts).length > 0
      ? Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  return {
    vendorId,
    totalBulkRevenue,
    totalRetailRevenue,
    bulkOrderCount: bulkOrders.length,
    retailOrderCount: retailOrders.length,
    averageBulkOrderValue,
    averageRetailOrderValue,
    bulkVsRetailRatio,
    topBulkOrderType,
    topIndustry,
    topRegion,
    periodStart: start,
    periodEnd: end,
  };
}

/**
 * Get admin's platform-wide B2B analytics
 */
export async function getAdminB2BBreakdown(
  startDate?: Date,
  endDate?: Date,
): Promise<AdminB2BBreakdown> {
  const start = startDate || subMonths(new Date(), 6);
  const end = endDate || new Date();

  // Get all bulk orders in period
  const bulkOrders = await Order.find({
    isBulkOrder: true,
    createdAt: { $gte: start, $lte: end },
    deleted: false,
    status: { $ne: 'cancelled' },
  })
    .populate('user')
    .populate('items.product');

  const totalBulkRevenue = bulkOrders.reduce((sum, o) => sum + o.total, 0);
  const averageBulkOrderValue = bulkOrders.length > 0 ? totalBulkRevenue / bulkOrders.length : 0;

  // Regional breakdown
  const regionMap: Record<string, { orders: any[]; revenue: number; industries: Set<string> }> = {};
  bulkOrders.forEach((o) => {
    const region = o.region || 'Unknown';
    if (!regionMap[region]) {
      regionMap[region] = { orders: [], revenue: 0, industries: new Set() };
    }
    regionMap[region].orders.push(o);
    regionMap[region].revenue += o.total;
    if (o.industry) regionMap[region].industries.add(o.industry);
  });

  const byRegion: RegionalStats[] = Object.entries(regionMap)
    .map(([region, data]) => ({
      region,
      orderCount: data.orders.length,
      revenue: data.revenue,
      averageOrderValue: data.revenue / data.orders.length,
      topIndustries: Array.from(data.industries).slice(0, 3),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Industry breakdown
  const industryMap: Record<string, { orders: any[]; revenue: number; regions: Set<string> }> = {};
  bulkOrders.forEach((o) => {
    const industry = o.industry || 'Unknown';
    if (!industryMap[industry]) {
      industryMap[industry] = { orders: [], revenue: 0, regions: new Set() };
    }
    industryMap[industry].orders.push(o);
    industryMap[industry].revenue += o.total;
    if (o.region) industryMap[industry].regions.add(o.region);
  });

  const byIndustry: IndustryStats[] = Object.entries(industryMap)
    .map(([industry, data]) => ({
      industry,
      orderCount: data.orders.length,
      revenue: data.revenue,
      averageOrderValue: data.revenue / data.orders.length,
      topRegions: Array.from(data.regions).slice(0, 3),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Bulk order type breakdown
  const typeMap: Record<string, { orders: any[]; revenue: number }> = {};
  bulkOrders.forEach((o) => {
    const type = o.bulkOrderType || 'custom';
    if (!typeMap[type]) {
      typeMap[type] = { orders: [], revenue: 0 };
    }
    typeMap[type].orders.push(o);
    typeMap[type].revenue += o.total;
  });

  const byBulkOrderType: BulkTypeStats[] = Object.entries(typeMap)
    .map(([type, data]) => ({
      type,
      orderCount: data.orders.length,
      revenue: data.revenue,
      averageOrderValue: data.revenue / data.orders.length,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Top vendors (simplified - assume vendor info in product or separate field)
  // For now, placeholder
  const topVendors: VendorStats[] = [];

  // Recent trends (daily for last 30 days)
  const trendDays = 30;
  const recentTrends: TrendData[] = [];
  for (let i = trendDays - 1; i >= 0; i--) {
    const dayStart = startOfDay(subDays(new Date(), i));
    const dayEnd = endOfDay(subDays(new Date(), i));
    const dayOrders = bulkOrders.filter(
      (o) => o.createdAt && o.createdAt >= dayStart && o.createdAt <= dayEnd,
    );
    recentTrends.push({
      date: dayStart.toISOString().split('T')[0],
      orderCount: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
    });
  }

  return {
    totalBulkRevenue,
    totalBulkOrders: bulkOrders.length,
    averageBulkOrderValue,
    byRegion,
    byIndustry,
    byBulkOrderType,
    topVendors,
    recentTrends,
    periodStart: start,
    periodEnd: end,
  };
}

/**
 * Get vendor's B2B export data for accounting
 */
export async function getVendorB2BExport(
  vendorId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<ExportData[]> {
  const start = startDate || subMonths(new Date(), 1);
  const end = endDate || new Date();

  const orders = await Order.find({
    vendor: vendorId,
    isBulkOrder: true,
    createdAt: { $gte: start, $lte: end },
    deleted: false,
  })
    .populate('user')
    .sort({ createdAt: -1 });

  return orders.map((o) => {
    const user = o.user as any;
    return {
      orderId: String(o._id),
      date: o.createdAt ? o.createdAt.toISOString().split('T')[0] : '',
      buyerName: user?.name || 'N/A',
      buyerCompany: user?.companyName,
      industry: o.industry,
      region: o.region,
      orderType: o.bulkOrderType || 'custom',
      subtotal: o.subtotal,
      tax: o.tax,
      total: o.total,
      paymentStatus: o.paymentStatus,
      paidAmount: o.paidAmount,
      outstandingAmount: o.outstandingAmount,
      creditUsed: o.creditUsed,
      dueDate: o.paymentTerms?.dueDate?.toISOString().split('T')[0],
    };
  });
}

/**
 * Get admin's platform-wide B2B export data
 */
export async function getAdminB2BExport(
  startDate?: Date,
  endDate?: Date,
  region?: string,
  industry?: string,
): Promise<ExportData[]> {
  const start = startDate || subMonths(new Date(), 1);
  const end = endDate || new Date();

  const filter: any = {
    isBulkOrder: true,
    createdAt: { $gte: start, $lte: end },
    deleted: false,
  };

  if (region) filter.region = region;
  if (industry) filter.industry = industry;

  const orders = await Order.find(filter).populate('user').sort({ createdAt: -1 });

  return orders.map((o) => {
    const user = o.user as any;
    return {
      orderId: String(o._id),
      date: o.createdAt ? o.createdAt.toISOString().split('T')[0] : '',
      buyerName: user?.name || 'N/A',
      buyerCompany: user?.companyName,
      industry: o.industry,
      region: o.region,
      orderType: o.bulkOrderType || 'custom',
      subtotal: o.subtotal,
      tax: o.tax,
      total: o.total,
      paymentStatus: o.paymentStatus,
      paidAmount: o.paidAmount,
      outstandingAmount: o.outstandingAmount,
      creditUsed: o.creditUsed,
      dueDate: o.paymentTerms?.dueDate?.toISOString().split('T')[0],
    };
  });
}

/**
 * Convert export data to CSV format
 */
export function exportDataToCSV(data: ExportData[]): string {
  const headers = [
    'Order ID',
    'Date',
    'Buyer Name',
    'Company',
    'Industry',
    'Region',
    'Order Type',
    'Subtotal',
    'Tax',
    'Total',
    'Payment Status',
    'Paid Amount',
    'Outstanding',
    'Credit Used',
    'Due Date',
  ];

  const rows = data.map((d) => [
    d.orderId,
    d.date,
    d.buyerName,
    d.buyerCompany || '',
    d.industry || '',
    d.region || '',
    d.orderType,
    d.subtotal.toFixed(2),
    d.tax.toFixed(2),
    d.total.toFixed(2),
    d.paymentStatus,
    d.paidAmount.toFixed(2),
    d.outstandingAmount.toFixed(2),
    d.creditUsed.toFixed(2),
    d.dueDate || '',
  ]);

  const csvLines = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(','));

  return csvLines.join('\n');
}

/**
 * Get vendor's trend data for charts
 */
export async function getVendorB2BTrends(
  vendorId: string,
  days: number = 30,
): Promise<TrendData[]> {
  const trends: TrendData[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = startOfDay(subDays(new Date(), i));
    const dayEnd = endOfDay(subDays(new Date(), i));

    const orders = await Order.find({
      // Filter by vendor
      isBulkOrder: true,
      createdAt: { $gte: dayStart, $lte: dayEnd },
      deleted: false,
      status: { $ne: 'cancelled' },
      vendor: vendorId,
    });

    trends.push({
      date: dayStart.toISOString().split('T')[0],
      orderCount: orders.length,
      revenue: orders.reduce((sum, o) => sum + o.total, 0),
    });
  }

  return trends;
}
