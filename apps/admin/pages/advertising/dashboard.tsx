/**
 * Admin Advertising Dashboard
 * Platform-wide ad metrics and fraud detection
 */

import { useState, useEffect } from 'react';

interface AdminDashboardData {
  platformMetrics: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalRevenue: number;
    totalImpressions: number;
    totalClicks: number;
    overallCTR: string;
    averageRevenuePerClick: string;
  };
  dailyRevenue: Array<{
    _id: string;
    revenue: number;
    clicks: number;
    conversions: number;
  }>;
  topVendors: Array<{
    vendorId: string;
    vendorName: string;
    totalSpent: number;
    campaignCount: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
  }>;
  placementStats: Array<{
    placement: string;
    clicks: number;
    revenue: number;
    conversions: number;
    conversionRate: number;
  }>;
  alerts: {
    suspiciousCampaigns: Array<{
      id: string;
      name: string;
      vendor: { businessName: string; email: string };
      impressions: number;
      clicks: number;
      ctr: number;
      reason: string;
    }>;
    highSpendCampaigns: Array<{
      id: string;
      name: string;
      vendor: { businessName: string; email: string };
      spentTotal: number;
      totalBudget: number;
      percentSpent: string;
    }>;
  };
}

export default function AdminAdvertisingDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/ad-dashboard/admin/overview?daysBack=${dateRange}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button onClick={fetchDashboardData} className="mt-2 text-red-600 underline">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Advertising Platform Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitor platform-wide ad performance and revenue</p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 flex gap-2">
        {[7, 30, 90].map((days) => (
          <button
            key={days}
            onClick={() => setDateRange(days)}
            className={`px-4 py-2 rounded-lg transition ${
              dateRange === days
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last {days} Days
          </button>
        ))}
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            ₹{data.platformMetrics.totalRevenue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            From {data.platformMetrics.totalClicks.toLocaleString()} clicks
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Active Campaigns</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {data.platformMetrics.activeCampaigns}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            of {data.platformMetrics.totalCampaigns} total
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Impressions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {data.platformMetrics.totalImpressions.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">{data.platformMetrics.overallCTR}% CTR</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Avg Revenue Per Click</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ₹{data.platformMetrics.averageRevenuePerClick}
          </p>
          <p className="text-sm text-gray-500 mt-1">Platform average</p>
        </div>
      </div>

      {/* Alerts Section */}
      {(data.alerts.suspiciousCampaigns.length > 0 ||
        data.alerts.highSpendCampaigns.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Suspicious Campaigns */}
          {data.alerts.suspiciousCampaigns.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚠️</span>
                <h2 className="text-lg font-bold text-red-900">Suspicious Activity</h2>
              </div>
              <div className="space-y-3">
                {data.alerts.suspiciousCampaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-white rounded p-3 border border-red-200">
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-600">
                      {campaign.vendor.businessName} ({campaign.vendor.email})
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {campaign.reason} • {campaign.ctr.toFixed(2)}% CTR • {campaign.clicks} clicks
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High Spend Alerts */}
          {data.alerts.highSpendCampaigns.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💰</span>
                <h2 className="text-lg font-bold text-yellow-900">High Spend Campaigns</h2>
              </div>
              <div className="space-y-3">
                {data.alerts.highSpendCampaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-white rounded p-3 border border-yellow-200">
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-600">{campaign.vendor.businessName}</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      ₹{campaign.spentTotal.toFixed(2)} of ₹{campaign.totalBudget.toFixed(2)} (
                      {campaign.percentSpent}% spent)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Spending Vendors */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Spending Vendors</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vendor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Spent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Campaigns
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Impressions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Clicks
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  CTR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.topVendors.map((vendor, index) => (
                <tr key={vendor.vendorId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">#{index + 1}</span>
                      <span className="font-medium">{vendor.vendorName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-green-600">
                      ₹{vendor.totalSpent.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{vendor.campaignCount}</td>
                  <td className="px-4 py-3">{vendor.totalImpressions.toLocaleString()}</td>
                  <td className="px-4 py-3">{vendor.totalClicks.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="text-blue-600 font-medium">{vendor.ctr.toFixed(2)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Placement Performance */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Performance by Placement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.placementStats.map((stat) => (
            <div key={stat.placement} className="border rounded-lg p-4">
              <p className="font-medium text-gray-900 capitalize mb-3">
                {stat.placement.replace('_', ' ')}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Clicks:</span>
                  <span className="font-medium">{stat.clicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue:</span>
                  <span className="font-medium text-green-600">₹{stat.revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversions:</span>
                  <span className="font-medium">{stat.conversions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conv Rate:</span>
                  <span className="font-medium text-blue-600">
                    {stat.conversionRate.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Revenue Chart (Simple visualization) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Revenue Trend</h2>
        <div className="space-y-2">
          {data.dailyRevenue.slice(-14).map((day) => {
            const maxRevenue = Math.max(...data.dailyRevenue.map((d) => d.revenue));
            const widthPercent = (day.revenue / maxRevenue) * 100;

            return (
              <div key={day._id} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-24">{day._id}</span>
                <div className="flex-1 bg-gray-100 rounded h-8 relative">
                  <div
                    className="bg-green-500 h-8 rounded flex items-center justify-end px-2"
                    style={{ width: `${widthPercent}%` }}
                  >
                    <span className="text-white text-sm font-medium">
                      ₹{day.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-20">{day.clicks} clicks</span>
                <span className="text-sm text-blue-600 w-24">{day.conversions} conv</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
