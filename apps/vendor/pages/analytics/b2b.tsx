/**
 * Vendor B2B Analytics Dashboard
 * Shows bulk sales summary, trends, and export options
 */

import React, { useState, useEffect } from 'react';

interface B2BSummary {
  vendorId: string;
  totalBulkRevenue: number;
  totalRetailRevenue: number;
  bulkOrderCount: number;
  retailOrderCount: number;
  averageBulkOrderValue: number;
  averageRetailOrderValue: number;
  bulkVsRetailRatio: number;
  topBulkOrderType: string | null;
  topIndustry: string | null;
  topRegion: string | null;
  periodStart: string;
  periodEnd: string;
}

interface TrendData {
  date: string;
  orderCount: number;
  revenue: number;
}

export default function VendorB2BAnalytics() {
  const [summary, setSummary] = useState<B2BSummary | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months ago
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exportLoading, setExportLoading] = useState(false);

  const vendorId = 'VENDOR_ID'; // Replace with actual auth

  useEffect(() => {
    fetchSummary();
    fetchTrends();
  }, [dateRange]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        vendorId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const response = await fetch(`/api/analytics/vendor/b2b/summary?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setSummary(result.data);
      } else {
        console.error('Failed to fetch B2B summary:', result.error);
      }
    } catch (error) {
      console.error('Error fetching B2B summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const params = new URLSearchParams({
        vendorId,
        days: '30'
      });
      
      const response = await fetch(`/api/analytics/vendor/b2b/trends?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setTrends(result.data);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setExportLoading(true);
      const params = new URLSearchParams({
        vendorId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format
      });
      
      const response = await fetch(`/api/analytics/vendor/b2b/export?${params}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `b2b_orders_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const result = await response.json();
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `b2b_orders_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading && !summary) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">B2B Analytics</h1>
        <p className="text-gray-600">Track your bulk and wholesale sales performance</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="mt-6">
            <button
              onClick={fetchSummary}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Bulk Revenue</div>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalBulkRevenue)}</div>
              <div className="text-xs text-gray-500 mt-1">{summary.bulkOrderCount} orders</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Retail Revenue</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRetailRevenue)}</div>
              <div className="text-xs text-gray-500 mt-1">{summary.retailOrderCount} orders</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Avg Bulk Order Value</div>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(summary.averageBulkOrderValue)}</div>
              <div className="text-xs text-gray-500 mt-1">vs {formatCurrency(summary.averageRetailOrderValue)} retail</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Bulk vs Retail</div>
              <div className="text-2xl font-bold text-orange-600">{formatPercentage(summary.bulkVsRetailRatio)}</div>
              <div className="text-xs text-gray-500 mt-1">bulk revenue share</div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Key Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Top Order Type</div>
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {summary.topBulkOrderType || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Top Industry</div>
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {summary.topIndustry || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Top Region</div>
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {summary.topRegion || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Trends Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">30-Day Trends</h2>
            <div className="h-64">
              {/* Simple bar chart visualization */}
              <div className="flex items-end justify-between h-full gap-1">
                {trends.map((trend, index) => {
                  const maxRevenue = Math.max(...trends.map(t => t.revenue));
                  const height = maxRevenue > 0 ? (trend.revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${trend.date}: ${formatCurrency(trend.revenue)} (${trend.orderCount} orders)`}
                      ></div>
                      {index % 5 === 0 && (
                        <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                          {trend.date.split('-')[2]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">
              Daily bulk order revenue (hover for details)
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Export Data</h2>
            <p className="text-gray-600 mb-4">
              Download your bulk order data for accounting or reconciliation purposes.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleExport('csv')}
                disabled={exportLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading ? 'Exporting...' : 'Export as CSV'}
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={exportLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading ? 'Exporting...' : 'Export as JSON'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * Export includes order details, payment status, outstanding amounts, and credit information for the selected date range.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
