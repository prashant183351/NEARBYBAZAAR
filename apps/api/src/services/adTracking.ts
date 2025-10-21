import { Types } from 'mongoose';
import { AdCampaign } from '../models/AdCampaign';
import { AdClick } from '../models/AdClick';
import { Vendor } from '../models/Vendor';
import { calculateClickCost } from './adAuction';

export interface ImpressionData {
	campaignId: string;
	userId?: string;
	sessionId?: string;
	placement: string;
	keyword?: string;
}

export interface ClickData {
	campaignId: string;
	userId?: string;
	sessionId?: string;
	placement: string;
	keyword?: string;
	ipAddress?: string;
	userAgent?: string;
	referer?: string;
}

export interface TrackingResult {
	success: boolean;
	message: string;
	cost?: number;
	clickId?: string;
}

/**
 * Record an ad impression
 */
export async function recordImpression(data: ImpressionData): Promise<boolean> {
	try {
		const campaign = await AdCampaign.findById(data.campaignId);
		if (!campaign) {
			console.error(`Campaign not found: ${data.campaignId}`);
			return false;
		}

		// Update campaign impressions
		if (campaign.recordImpression) {
			await campaign.recordImpression();
		}

		return true;
	} catch (error) {
		console.error('Error recording impression:', error);
		return false;
	}
}

/**
 * Detect if click is fraudulent (duplicate within time window)
 */
async function detectDuplicateClick(data: ClickData): Promise<boolean> {
	const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

	// Check for duplicate by userId or sessionId
	const query: any = {
		campaign: data.campaignId,
		clickedAt: { $gte: fiveMinutesAgo },
	};

	if (data.userId) {
		query.user = data.userId;
	} else if (data.sessionId) {
		query.sessionId = data.sessionId;
	} else {
		// No identifier, can't detect duplicates reliably
		return false;
	}

	const existingClick = await AdClick.findOne(query);
	return existingClick !== null;
}

/**
 * Charge vendor wallet for ad click
 */
async function chargeVendorWallet(
	vendorId: string,
	cost: number,
	campaignId: string
): Promise<boolean> {
	try {
		const vendor = await Vendor.findById(vendorId);
		if (!vendor) {
			console.error(`Vendor not found: ${vendorId}`);
			return false;
		}

		// Check if vendor has wallet balance (assuming wallet field exists)
		// For now, we'll just log the charge
		// TODO: Implement actual wallet deduction once wallet system is ready
		console.log(`Charging vendor ${vendorId} ₹${cost} for campaign ${campaignId}`);

		// In production, this would be:
		// if (vendor.walletBalance < cost) {
		//   return false;
		// }
		// vendor.walletBalance -= cost;
		// await vendor.save();

		return true;
	} catch (error) {
		console.error('Error charging vendor wallet:', error);
		return false;
	}
}

/**
 * Record an ad click
 */
export async function recordClick(data: ClickData): Promise<TrackingResult> {
	try {
		// Check for duplicate click (fraud prevention)
		const isDuplicate = await detectDuplicateClick(data);
		if (isDuplicate) {
			return {
				success: false,
				message: 'Duplicate click detected (within 5-minute window)',
			};
		}

		// Get campaign
		const campaign = await AdCampaign.findById(data.campaignId).populate('vendor');
		if (!campaign) {
			return {
				success: false,
				message: 'Campaign not found',
			};
		}

		// Check if campaign can serve (has budget)
		if (campaign.canServe && !campaign.canServe()) {
			return {
				success: false,
				message: 'Campaign budget exhausted',
			};
		}

		// Calculate click cost
		const cost = calculateClickCost(campaign);

		// Charge vendor wallet
		const charged = await chargeVendorWallet(
			String(campaign.vendor),
			cost,
			String(campaign._id)
		);

		if (!charged) {
			return {
				success: false,
				message: 'Failed to charge vendor wallet',
			};
		}

		// Create click record
		const click = new AdClick({
			campaign: campaign._id,
			vendor: campaign.vendor,
			product: campaign.product,
			user: data.userId ? new Types.ObjectId(data.userId) : undefined,
			sessionId: data.sessionId,
			placement: data.placement,
			keyword: data.keyword,
			cost,
			ipAddress: data.ipAddress,
			userAgent: data.userAgent,
			referer: data.referer,
		});

		await click.save();

		// Update campaign metrics
		if (campaign.recordClick) {
			await campaign.recordClick(cost);
		}

		return {
			success: true,
			message: 'Click recorded successfully',
			cost,
			clickId: String(click._id),
		};
	} catch (error) {
		console.error('Error recording click:', error);
		return {
			success: false,
			message: 'Internal error recording click',
		};
	}
}

/**
 * Record order conversion for a click
 */
export async function recordConversion(clickId: string, orderId: string): Promise<boolean> {
	try {
		const click = await AdClick.findById(clickId);
		if (!click) {
			console.error(`Click not found: ${clickId}`);
			return false;
		}

		// Update click with conversion
		click.convertedToOrder = true;
		click.orderId = new Types.ObjectId(orderId);
		await click.save();

		return true;
	} catch (error) {
		console.error('Error recording conversion:', error);
		return false;
	}
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(campaignId: string, startDate?: Date, endDate?: Date) {
	const query: any = { campaign: campaignId };

	if (startDate || endDate) {
		query.clickedAt = {};
		if (startDate) query.clickedAt.$gte = startDate;
		if (endDate) query.clickedAt.$lte = endDate;
	}

	const clicks = await AdClick.find(query);

	const totalClicks = clicks.length;
	const totalCost = clicks.reduce((sum, c) => sum + c.cost, 0);
	const conversions = clicks.filter((c) => c.convertedToOrder).length;
	const conversionRate = totalClicks > 0 ? conversions / totalClicks : 0;

	// Group by date
	const clicksByDate: Record<string, number> = {};
	const costByDate: Record<string, number> = {};

	clicks.forEach((click) => {
		const date = click.clickedAt.toISOString().split('T')[0];
		clicksByDate[date] = (clicksByDate[date] || 0) + 1;
		costByDate[date] = (costByDate[date] || 0) + click.cost;
	});

	// Group by placement
	const clicksByPlacement: Record<string, number> = {};
	clicks.forEach((click) => {
		clicksByPlacement[click.placement] = (clicksByPlacement[click.placement] || 0) + 1;
	});

	// Group by keyword
	const clicksByKeyword: Record<string, number> = {};
	clicks.forEach((click) => {
		if (click.keyword) {
			clicksByKeyword[click.keyword] = (clicksByKeyword[click.keyword] || 0) + 1;
		}
	});

	return {
		totalClicks,
		totalCost,
		conversions,
		conversionRate,
		avgCostPerClick: totalClicks > 0 ? totalCost / totalClicks : 0,
		costPerConversion: conversions > 0 ? totalCost / conversions : 0,
		clicksByDate,
		costByDate,
		clicksByPlacement,
		clicksByKeyword,
	};
}

/**
 * Get vendor advertising analytics
 */
export async function getVendorAnalytics(vendorId: string, startDate?: Date, endDate?: Date) {
	const query: any = { vendor: vendorId };

	if (startDate || endDate) {
		query.clickedAt = {};
		if (startDate) query.clickedAt.$gte = startDate;
		if (endDate) query.clickedAt.$lte = endDate;
	}

	const clicks = await AdClick.find(query);

	const totalSpend = clicks.reduce((sum, c) => sum + c.cost, 0);
	const conversions = clicks.filter((c) => c.convertedToOrder).length;

	// Get all vendor campaigns
	const campaigns = await AdCampaign.find({ vendor: vendorId });
	const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
	const avgCTR = campaigns.length > 0
		? campaigns.reduce((sum, c) => sum + c.ctr, 0) / campaigns.length
		: 0;

	return {
		totalCampaigns: campaigns.length,
		activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
		totalImpressions,
		totalClicks: clicks.length,
		totalSpend,
		conversions,
		avgCTR,
		conversionRate: clicks.length > 0 ? conversions / clicks.length : 0,
		avgCostPerClick: clicks.length > 0 ? totalSpend / clicks.length : 0,
		costPerConversion: conversions > 0 ? totalSpend / conversions : 0,
	};
}

/**
 * Detect potential click fraud patterns
 */
export async function detectFraudPatterns(campaignId: string, hours: number = 24) {
	const since = new Date(Date.now() - hours * 60 * 60 * 1000);

	const clicks = await AdClick.find({
		campaign: campaignId,
		clickedAt: { $gte: since },
	});

	const patterns: string[] = [];

	// Check for rapid clicks from same IP
	const clicksByIP: Record<string, number> = {};
	clicks.forEach((click) => {
		if (click.ipAddress) {
			clicksByIP[click.ipAddress] = (clicksByIP[click.ipAddress] || 0) + 1;
		}
	});

	Object.entries(clicksByIP).forEach(([ip, count]) => {
		if (count > 10) {
			patterns.push(`Suspicious: ${count} clicks from IP ${ip}`);
		}
	});

	// Check for clicks without conversions from same session
	const clicksBySession: Record<string, any[]> = {};
	clicks.forEach((click) => {
		if (click.sessionId) {
			if (!clicksBySession[click.sessionId]) {
				clicksBySession[click.sessionId] = [];
			}
			clicksBySession[click.sessionId].push(click);
		}
	});

	Object.entries(clicksBySession).forEach(([sessionId, sessionClicks]) => {
		if (sessionClicks.length > 5) {
			const conversions = sessionClicks.filter((c) => c.convertedToOrder).length;
			if (conversions === 0) {
				patterns.push(`Suspicious: ${sessionClicks.length} clicks from session ${sessionId} with no conversions`);
			}
		}
	});

	// Check for very low conversion rate
	const conversionRate = clicks.length > 0
		? clicks.filter((c) => c.convertedToOrder).length / clicks.length
		: 0;

	if (clicks.length > 50 && conversionRate < 0.001) {
		patterns.push(`Suspicious: Very low conversion rate (${(conversionRate * 100).toFixed(2)}%) with ${clicks.length} clicks`);
	}

	return {
		totalClicks: clicks.length,
		suspiciousPatterns: patterns,
		fraudRisk: patterns.length > 0 ? 'high' : 'low',
	};
}
