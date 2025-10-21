/**
 * Vendor Campaigns Dashboard
 * Overview of all campaigns with key metrics
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Campaign {
	id: string;
	name: string;
	product: {
		name: string;
		slug: string;
		images?: string[];
	};
	status: 'draft' | 'active' | 'paused' | 'completed' | 'expired';
	bidType: 'cpc' | 'cpm';
	bidAmount: number;
	impressions: number;
	clicks: number;
	ctr: number;
	avgCpc: number;
	spentTotal: number;
	totalBudget: number;
	startDate: string;
	endDate?: string;
}

interface DashboardData {
	summary: {
		totalCampaigns: number;
		activeCampaigns: number;
		pausedCampaigns: number;
		draftCampaigns: number;
		totalImpressions: number;
		totalClicks: number;
		totalSpent: number;
		averageCTR: number;
		averageCPC: number;
	};
	dailyStats: Array<{
		_id: string;
		clicks: number;
		cost: number;
		conversions: number;
	}>;
	topCampaigns: Array<{
		id: string;
		name: string;
		impressions: number;
		clicks: number;
		ctr: string;
		spent: string;
	}>;
	budgetAnalysis: {
		totalBudget: number;
		totalSpent: number;
		remainingBudget: number;
		dailyBudgetTotal: number;
		dailySpentToday: number;
	};
	campaigns: Campaign[];
}

export default function CampaignsDashboard() {
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<DashboardData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [dateRange, setDateRange] = useState(30);

	useEffect(() => {
		fetchDashboardData();
	}, [dateRange]);

	const fetchDashboardData = async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`/api/v1/ad-dashboard/vendor/summary?daysBack=${dateRange}`,
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				}
			);

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

	const getStatusBadgeClass = (status: string) => {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'paused':
				return 'bg-yellow-100 text-yellow-800';
			case 'draft':
				return 'bg-gray-100 text-gray-800';
			case 'expired':
				return 'bg-red-100 text-red-800';
			case 'completed':
				return 'bg-blue-100 text-blue-800';
			default:
				return 'bg-gray-100 text-gray-800';
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
					<button
						onClick={fetchDashboardData}
						className="mt-2 text-red-600 underline"
					>
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
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">
						Ad Campaigns Dashboard
					</h1>
					<p className="text-gray-600 mt-1">
						Manage and monitor your advertising campaigns
					</p>
				</div>
				<Link
					href="/campaigns/create"
					className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
				>
					Create Campaign
				</Link>
			</div>

			{/* Date Range Filter */}
			<div className="mb-6 flex gap-2">
				{[7, 30, 90].map(days => (
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

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<div className="bg-white rounded-lg shadow p-6">
					<p className="text-gray-600 text-sm">Total Campaigns</p>
					<p className="text-3xl font-bold text-gray-900 mt-2">
						{data.summary.totalCampaigns}
					</p>
					<p className="text-sm text-gray-500 mt-1">
						{data.summary.activeCampaigns} active
					</p>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<p className="text-gray-600 text-sm">Total Impressions</p>
					<p className="text-3xl font-bold text-gray-900 mt-2">
						{data.summary.totalImpressions.toLocaleString()}
					</p>
					<p className="text-sm text-gray-500 mt-1">
						{data.summary.totalClicks.toLocaleString()} clicks
					</p>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<p className="text-gray-600 text-sm">Average CTR</p>
					<p className="text-3xl font-bold text-gray-900 mt-2">
						{data.summary.averageCTR.toFixed(2)}%
					</p>
					<p className="text-sm text-gray-500 mt-1">Click-through rate</p>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<p className="text-gray-600 text-sm">Total Spent</p>
					<p className="text-3xl font-bold text-gray-900 mt-2">
						₹{data.summary.totalSpent.toFixed(2)}
					</p>
					<p className="text-sm text-gray-500 mt-1">
						Avg CPC: ₹{data.summary.averageCPC.toFixed(2)}
					</p>
				</div>
			</div>

			{/* Budget Overview */}
			<div className="bg-white rounded-lg shadow p-6 mb-8">
				<h2 className="text-xl font-bold text-gray-900 mb-4">
					Budget Overview
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div>
						<p className="text-gray-600 text-sm">Total Budget</p>
						<p className="text-2xl font-bold text-gray-900 mt-1">
							₹{data.budgetAnalysis.totalBudget.toFixed(2)}
						</p>
					</div>
					<div>
						<p className="text-gray-600 text-sm">Total Spent</p>
						<p className="text-2xl font-bold text-gray-900 mt-1">
							₹{data.budgetAnalysis.totalSpent.toFixed(2)}
						</p>
						<div className="mt-2 w-full bg-gray-200 rounded-full h-2">
							<div
								className="bg-blue-600 h-2 rounded-full"
								style={{
									width: `${
										(data.budgetAnalysis.totalSpent /
											data.budgetAnalysis.totalBudget) *
										100
									}%`,
								}}
							></div>
						</div>
					</div>
					<div>
						<p className="text-gray-600 text-sm">Remaining Budget</p>
						<p className="text-2xl font-bold text-green-600 mt-1">
							₹{data.budgetAnalysis.remainingBudget.toFixed(2)}
						</p>
					</div>
				</div>
			</div>

			{/* Top Performing Campaigns */}
			{data.topCampaigns.length > 0 && (
				<div className="bg-white rounded-lg shadow p-6 mb-8">
					<h2 className="text-xl font-bold text-gray-900 mb-4">
						Top Performing Campaigns
					</h2>
					<div className="space-y-3">
						{data.topCampaigns.map(campaign => (
							<div
								key={campaign.id}
								className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
							>
								<div className="flex-1">
									<p className="font-medium text-gray-900">{campaign.name}</p>
									<p className="text-sm text-gray-600">
										{campaign.impressions.toLocaleString()} impressions •{' '}
										{campaign.clicks.toLocaleString()} clicks
									</p>
								</div>
								<div className="text-right">
									<p className="font-bold text-green-600">{campaign.ctr}% CTR</p>
									<p className="text-sm text-gray-600">₹{campaign.spent} spent</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* All Campaigns Table */}
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-xl font-bold text-gray-900">All Campaigns</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Campaign
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Bid
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Performance
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Budget
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{data.campaigns.map(campaign => (
								<tr key={campaign.id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="flex items-center">
											{campaign.product.images?.[0] && (
												<img
													src={campaign.product.images[0]}
													alt={campaign.product.name}
													className="h-10 w-10 rounded object-cover mr-3"
												/>
											)}
											<div>
												<p className="font-medium text-gray-900">
													{campaign.name}
												</p>
												<p className="text-sm text-gray-600">
													{campaign.product.name}
												</p>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span
											className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
												campaign.status
											)}`}
										>
											{campaign.status}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<p className="text-sm text-gray-900">
											₹{campaign.bidAmount}
										</p>
										<p className="text-xs text-gray-500 uppercase">
											{campaign.bidType}
										</p>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<p className="text-sm text-gray-900">
											{campaign.impressions.toLocaleString()} impressions
										</p>
										<p className="text-sm text-gray-900">
											{campaign.clicks.toLocaleString()} clicks • {campaign.ctr.toFixed(2)}% CTR
										</p>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<p className="text-sm text-gray-900">
											₹{campaign.spentTotal.toFixed(2)} / ₹
											{campaign.totalBudget.toFixed(2)}
										</p>
										<div className="mt-1 w-24 bg-gray-200 rounded-full h-1.5">
											<div
												className="bg-blue-600 h-1.5 rounded-full"
												style={{
													width: `${
														(campaign.spentTotal / campaign.totalBudget) * 100
													}%`,
												}}
											></div>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-right text-sm">
										<Link
											href={`/campaigns/${campaign.id}`}
											className="text-blue-600 hover:text-blue-800 mr-3"
										>
											View
										</Link>
										<Link
											href={`/campaigns/${campaign.id}/edit`}
											className="text-gray-600 hover:text-gray-800"
										>
											Edit
										</Link>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
