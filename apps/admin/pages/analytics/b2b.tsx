/**
 * Admin B2B Analytics Dashboard
 * Platform-wide B2B breakdown by region, industry, and trends
 */

import React, { useState, useEffect } from 'react';

interface RegionalStats {
  region: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
  topIndustries: string[];
}

interface IndustryStats {
  industry: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
  topRegions: string[];
}

interface BulkTypeStats {
  type: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

interface TrendData {
  date: string;
  orderCount: number;
  revenue: number;
}

interface AdminB2BBreakdown {
  totalBulkRevenue: number;
  totalBulkOrders: number;
  averageBulkOrderValue: number;
  byRegion: RegionalStats[];
  byIndustry: IndustryStats[];
  byBulkOrderType: BulkTypeStats[];
  recentTrends: TrendData[];
  periodStart: string;
  periodEnd: string;
}

export default function AdminB2BAnalytics() {
  const [breakdown, setBreakdown] = useState<AdminB2BBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exportFilters, setExportFilters] = useState({
    region: '',
    industry: ''
  });
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'regional' | 'industry' | 'types'>('overview');

  useEffect(() => {
    fetchBreakdown();
    fetchFilters();
  }, [dateRange]);

  const fetchBreakdown = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const response = await fetch(`/api/analytics/admin/b2b/breakdown?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setBreakdown(result.data);
      } else {
        console.error('Failed to fetch B2B breakdown:', result.error);
      }
    } catch (error) {
      console.error('Error fetching B2B breakdown:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [regionsRes, industriesRes] = await Promise.all([
        fetch('/api/analytics/admin/b2b/regions'),
        fetch('/api/analytics/admin/b2b/industries')
      ]);
      
      const regionsData = await regionsRes.json();
      const industriesData = await industriesRes.json();
      
      if (regionsData.success) setAvailableRegions(regionsData.data);
      if (industriesData.success) setAvailableIndustries(industriesData.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setExportLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format
      });
      
      if (exportFilters.region) params.append('region', exportFilters.region);
      if (exportFilters.industry) params.append('industry', exportFilters.industry);
      
      const response = await fetch(`/api/analytics/admin/b2b/export?${params}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `b2b_platform_${Date.now()}.csv`;
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
        a.download = `b2b_platform_${Date.now()}.json`;
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

  if (loading && !breakdown) {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">B2B Platform Analytics</h1>
        <p className="text-gray-600">Comprehensive breakdown of bulk order activity across regions and industries</p>
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
              onClick={fetchBreakdown}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {breakdown && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Total B2B Revenue</div>
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(breakdown.totalBulkRevenue)}</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Total B2B Orders</div>
              <div className="text-3xl font-bold text-green-600">{breakdown.totalBulkOrders.toLocaleString()}</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Avg Order Value</div>
              <div className="text-3xl font-bold text-purple-600">{formatCurrency(breakdown.averageBulkOrderValue)}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'overview'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('regional')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'regional'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  By Region
                </button>
                <button
                  onClick={() => setActiveTab('industry')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'industry'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  By Industry
                </button>
                <button
                  onClick={() => setActiveTab('types')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'types'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  By Order Type
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">30-Day Trends</h3>
                  <div className="h-64 mb-6">
                    <div className="flex items-end justify-between h-full gap-1">
                      {breakdown.recentTrends.map((trend, index) => {
                        const maxRevenue = Math.max(...breakdown.recentTrends.map(t => t.revenue));
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
                  <div className="text-center text-sm text-gray-600">
                    Daily B2B order revenue (hover for details)
                  </div>
                </div>
              )}

              {/* Regional Tab */}
              {activeTab === 'regional' && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Regional Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Top Industries</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {breakdown.byRegion.map((region) => (
                          <tr key={region.region} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                              {region.region}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {region.orderCount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                              {formatCurrency(region.revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(region.averageOrderValue)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {region.topIndustries.join(', ') || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Industry Tab */}
              {activeTab === 'industry' && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Industry Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Top Regions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {breakdown.byIndustry.map((industry) => (
                          <tr key={industry.industry} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                              {industry.industry}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {industry.orderCount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                              {formatCurrency(industry.revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(industry.averageOrderValue)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {industry.topRegions.join(', ') || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Order Types Tab */}
              {activeTab === 'types' && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Bulk Order Type Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {breakdown.byBulkOrderType.map((type) => (
                      <div key={type.type} className="bg-gray-50 rounded-lg p-6">
                        <div className="text-sm font-medium text-gray-500 mb-1 capitalize">{type.type}</div>
                        <div className="text-2xl font-bold text-blue-600 mb-2">{formatCurrency(type.revenue)}</div>
                        <div className="text-sm text-gray-600">{type.orderCount} orders</div>
                        <div className="text-xs text-gray-500 mt-1">Avg: {formatCurrency(type.averageOrderValue)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Export Data</h2>
            <p className="text-gray-600 mb-4">
              Download platform-wide B2B order data with optional region and industry filters.
            </p>
            
            {/* Export Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Region (optional)</label>
                <select
                  value={exportFilters.region}
                  onChange={(e) => setExportFilters(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Regions</option>
                  {availableRegions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Industry (optional)</label>
                <select
                  value={exportFilters.industry}
                  onChange={(e) => setExportFilters(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Industries</option>
                  {availableIndustries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
            </div>

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
              * Export includes all order details, buyer information, payment status, and credit information for the selected filters.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
