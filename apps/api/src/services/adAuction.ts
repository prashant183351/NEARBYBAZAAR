import { AdCampaign, AdCampaignType, AdPlacement } from '../models/AdCampaign';

export interface AuctionContext {
	placement: AdPlacement;
	keywords?: string[];
	categoryId?: string;
	limit?: number;
}

export interface ScoredAd {
	campaign: AdCampaignType;
	score: number;
	bidAmount: number;
	relevanceScore: number;
	qualityScore: number;
}

export interface AdResult {
	campaign: AdCampaignType;
	product: any;
	vendor: any;
	score: number;
	isSponsored: true;
}

/**
 * Calculate relevance score for a campaign based on context
 */
function calculateRelevanceScore(
	campaign: AdCampaignType,
	context: AuctionContext
): number {
	let score = 0;
	const { keywords = [], categoryId } = context;

	// Keyword matching (0-50 points)
	if (keywords.length > 0 && campaign.keywords.length > 0) {
		const matchedKeywords = campaign.keywords.filter((k: string) =>
			keywords.some((ck) => ck.toLowerCase().includes(k) || k.includes(ck.toLowerCase()))
		);
		const keywordMatchRatio = matchedKeywords.length / Math.max(keywords.length, campaign.keywords.length);
		score += keywordMatchRatio * 50;
	}

	// Category matching (0-30 points)
	if (categoryId && campaign.targetCategories && campaign.targetCategories.length > 0) {
		if (campaign.targetCategories.includes(categoryId)) {
			score += 30;
		}
	}

	// Placement matching (0-20 points)
	if (campaign.placements.includes(context.placement)) {
		score += 20;
	}

	return score;
}

/**
 * Calculate quality score based on campaign performance
 */
function calculateQualityScore(campaign: AdCampaignType): number {
	let score = 50; // Base score

	// CTR boost (0-30 points)
	// Good CTR is > 2%, excellent is > 5%
	if (campaign.impressions > 100) {
		// Only consider if sufficient data
		const ctr = campaign.ctr;
		if (ctr >= 0.05) {
			score += 30;
		} else if (ctr >= 0.02) {
			score += 15;
		}
	}

	// Recency boost (0-20 points)
	// Campaigns served recently get a boost
	if (campaign.lastServed) {
		const hoursSinceLastServed = (Date.now() - campaign.lastServed.getTime()) / (1000 * 60 * 60);
		if (hoursSinceLastServed < 1) {
			score += 20;
		} else if (hoursSinceLastServed < 24) {
			score += 10;
		}
	}

	return Math.min(score, 100); // Cap at 100
}

/**
 * Run ad auction to select best ads for given context
 * Uses a combination of bid amount, relevance, and quality score
 */
export async function runAdAuction(context: AuctionContext): Promise<AdResult[]> {
	const { limit = 1 } = context;

	// Get eligible campaigns
	const campaigns = await AdCampaign.getActiveCampaigns(
		context.keywords,
		context.placement,
		context.categoryId
	);

	if (campaigns.length === 0) {
		return [];
	}

	// Score each campaign
	const scoredAds: ScoredAd[] = campaigns.map((campaign: AdCampaignType) => {
		const relevanceScore = calculateRelevanceScore(campaign, context);
		const qualityScore = calculateQualityScore(campaign);

		// Final score formula: bid * (relevance/100) * (quality/100)
		// This means a high bid with poor relevance/quality will lose to a lower bid with better targeting
		const score = campaign.bidAmount * (relevanceScore / 100) * (qualityScore / 100);

		return {
			campaign,
			score,
			bidAmount: campaign.bidAmount,
			relevanceScore,
			qualityScore,
		};
	});

	// Sort by score descending
	scoredAds.sort((a, b) => b.score - a.score);

	// Take top N
	const winners = scoredAds.slice(0, limit);

	// Record impressions for winning campaigns
	await Promise.all(winners.map((w) => w.campaign.recordImpression()));

	// Format results
	const results: AdResult[] = winners.map((w) => ({
		campaign: w.campaign,
		product: w.campaign.product,
		vendor: w.campaign.vendor,
		score: w.score,
		isSponsored: true as const,
	}));

	return results;
}

/**
 * Get effective CPC for a campaign (handles CPM conversion)
 */
export function getEffectiveCPC(campaign: AdCampaignType): number {
	if (campaign.bidType === 'cpc') {
		return campaign.bidAmount;
	} else {
		// CPM: cost per 1000 impressions
		// Estimate CPC based on typical CTR of 2%
		// CPC ≈ CPM / 1000 / estimated_CTR
		const estimatedCTR = campaign.ctr > 0 ? campaign.ctr : 0.02;
		return (campaign.bidAmount / 1000) / estimatedCTR;
	}
}

/**
 * Calculate actual cost for a click
 */
export function calculateClickCost(campaign: AdCampaignType): number {
	if (campaign.bidType === 'cpc') {
		return campaign.bidAmount;
	} else {
		// For CPM campaigns, charge proportional cost per click
		// This is approximate; in reality CPM charges per impression
		const estimatedCTR = campaign.ctr > 0 ? campaign.ctr : 0.02;
		return (campaign.bidAmount / 1000) / estimatedCTR;
	}
}

/**
 * Get ads for search results
 */
export async function getSearchAds(
	searchQuery: string,
	limit: number = 2
): Promise<AdResult[]> {
	const keywords = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
	
	return runAdAuction({
		placement: 'search',
		keywords,
		limit,
	});
}

/**
 * Get ads for category page
 */
export async function getCategoryAds(
	categoryId: string,
	limit: number = 3
): Promise<AdResult[]> {
	return runAdAuction({
		placement: 'category',
		categoryId,
		limit,
	});
}

/**
 * Get ads for homepage
 */
export async function getHomepageAds(limit: number = 5): Promise<AdResult[]> {
	return runAdAuction({
		placement: 'homepage',
		limit,
	});
}

/**
 * Validate campaign before creation/update
 */
export function validateCampaign(data: Partial<AdCampaignType>): string[] {
	const errors: string[] = [];

	if (data.bidAmount !== undefined && data.bidAmount <= 0) {
		errors.push('Bid amount must be greater than 0');
	}

	if (data.dailyBudget !== undefined && data.dailyBudget <= 0) {
		errors.push('Daily budget must be greater than 0');
	}

	if (data.totalBudget !== undefined && data.totalBudget <= 0) {
		errors.push('Total budget must be greater than 0');
	}

	if (
		data.dailyBudget !== undefined &&
		data.totalBudget !== undefined &&
		data.dailyBudget > data.totalBudget
	) {
		errors.push('Daily budget cannot exceed total budget');
	}

	if (data.bidType === 'cpc' && data.bidAmount && data.bidAmount < 1) {
		errors.push('CPC bid must be at least ₹1');
	}

	if (data.bidType === 'cpm' && data.bidAmount && data.bidAmount < 10) {
		errors.push('CPM bid must be at least ₹10');
	}

	if (data.startDate && data.endDate && data.startDate >= data.endDate) {
		errors.push('End date must be after start date');
	}

	if (data.keywords && data.keywords.length === 0) {
		errors.push('At least one keyword is required');
	}

	if (data.placements && data.placements.length === 0) {
		errors.push('At least one placement is required');
	}

	return errors;
}

/**
 * Estimate campaign reach and cost
 */
export async function estimateCampaignPerformance(
	keywords: string[],
	placement: AdPlacement,
	bidAmount: number,
	bidType: 'cpc' | 'cpm',
	dailyBudget: number
): Promise<{
	estimatedDailyImpressions: number;
	estimatedDailyClicks: number;
	estimatedDailyCost: number;
	estimatedCTR: number;
}> {
	// Get competing campaigns
	const competitors = await AdCampaign.getActiveCampaigns(keywords, placement);
	
	// Calculate average CTR from existing campaigns
	const avgCTR = competitors.length > 0
		? competitors.reduce((sum: number, c: AdCampaignType) => sum + (c.ctr || 0), 0) / competitors.length
		: 0.02; // Default 2%

	// Estimate based on bid type
	let estimatedDailyClicks = 0;
	let estimatedDailyImpressions = 0;

	if (bidType === 'cpc') {
		estimatedDailyClicks = Math.floor(dailyBudget / bidAmount);
		estimatedDailyImpressions = Math.floor(estimatedDailyClicks / avgCTR);
	} else {
		// CPM
		estimatedDailyImpressions = Math.floor((dailyBudget / bidAmount) * 1000);
		estimatedDailyClicks = Math.floor(estimatedDailyImpressions * avgCTR);
	}

	return {
		estimatedDailyImpressions,
		estimatedDailyClicks,
		estimatedDailyCost: dailyBudget,
		estimatedCTR: avgCTR,
	};
}
