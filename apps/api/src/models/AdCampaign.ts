import { Schema, model, Document, Types, Model } from 'mongoose';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'expired';
export type BidType = 'cpc' | 'cpm'; // Cost-per-click or Cost-per-1000-impressions
export type AdPlacement = 'search' | 'category' | 'homepage' | 'product_detail';

export interface AdCampaignType extends Document {
	vendor: Types.ObjectId;
	name: string;
	product: Types.ObjectId;
	status: CampaignStatus;
	bidType: BidType;
	bidAmount: number; // Amount in INR (for CPC: per click, for CPM: per 1000 impressions)
	dailyBudget: number; // Maximum spend per day in INR
	totalBudget: number; // Total campaign budget
	spentToday: number;
	spentTotal: number;
	keywords: string[]; // Keywords for targeting
	placements: AdPlacement[]; // Where ads should appear
	targetCategories?: string[]; // Category IDs to target
	impressions: number; // Total impressions served
	clicks: number; // Total clicks received
	ctr: number; // Click-through rate (clicks/impressions)
	avgCpc: number; // Average cost per click
	startDate: Date;
	endDate?: Date;
	lastServed?: Date; // Last time ad was served
	createdAt: Date;
	updatedAt: Date;
	
	// Instance methods
	canServe(): boolean;
	recordImpression(): Promise<void>;
	recordClick(cost: number): Promise<void>;
	resetDailySpend(): Promise<void>;
}

// Model interface with static methods
export interface AdCampaignModel extends Model<AdCampaignType> {
	getActiveCampaigns(
		keywords?: string[],
		placement?: AdPlacement,
		categoryId?: string
	): Promise<AdCampaignType[]>;
}

const AdCampaignSchema = new Schema<AdCampaignType>(
	{
		vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
		name: { type: String, required: true, trim: true },
		product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
		status: {
			type: String,
			enum: ['draft', 'active', 'paused', 'completed', 'expired'],
			default: 'draft',
			index: true,
		},
		bidType: { type: String, enum: ['cpc', 'cpm'], required: true },
		bidAmount: { type: Number, required: true, min: 0 },
		dailyBudget: { type: Number, required: true, min: 0 },
		totalBudget: { type: Number, required: true, min: 0 },
		spentToday: { type: Number, default: 0, min: 0 },
		spentTotal: { type: Number, default: 0, min: 0 },
		keywords: [{ type: String, trim: true, lowercase: true }],
		placements: [{ type: String, enum: ['search', 'category', 'homepage', 'product_detail'] }],
		targetCategories: [{ type: String }],
		impressions: { type: Number, default: 0, min: 0 },
		clicks: { type: Number, default: 0, min: 0 },
		ctr: { type: Number, default: 0, min: 0 }, // Click-through rate
		avgCpc: { type: Number, default: 0, min: 0 }, // Average cost per click
		startDate: { type: Date, required: true },
		endDate: { type: Date },
		lastServed: { type: Date },
	},
	{
		timestamps: true,
	}
);

// Indexes for efficient querying
AdCampaignSchema.index({ vendor: 1, status: 1 });
AdCampaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
AdCampaignSchema.index({ keywords: 1, status: 1 });
AdCampaignSchema.index({ placements: 1, status: 1 });

// Methods
AdCampaignSchema.methods.canServe = function (): boolean {
	const now = new Date();
	if (this.status !== 'active') return false;
	if (this.startDate > now) return false;
	if (this.endDate && this.endDate < now) return false;
	if (this.spentToday >= this.dailyBudget) return false;
	if (this.spentTotal >= this.totalBudget) return false;
	return true;
};

AdCampaignSchema.methods.recordImpression = async function (): Promise<void> {
	this.impressions += 1;
	this.lastServed = new Date();
	await this.save();
};

AdCampaignSchema.methods.recordClick = async function (cost: number): Promise<void> {
	this.clicks += 1;
	this.spentToday += cost;
	this.spentTotal += cost;
	this.ctr = this.impressions > 0 ? this.clicks / this.impressions : 0;
	this.avgCpc = this.clicks > 0 ? this.spentTotal / this.clicks : 0;
	
	// Check if budget exhausted
	if (this.spentTotal >= this.totalBudget) {
		this.status = 'completed';
	}
	
	await this.save();
};

AdCampaignSchema.methods.resetDailySpend = async function (): Promise<void> {
	this.spentToday = 0;
	await this.save();
};

// Statics
AdCampaignSchema.statics.getActiveCampaigns = function (
	keywords?: string[],
	placement?: AdPlacement,
	categoryId?: string
) {
	const query: any = {
		status: 'active',
		startDate: { $lte: new Date() },
		$or: [{ endDate: null }, { endDate: { $gte: new Date() } }],
	};

	// Budget constraints
	query.$expr = {
		$and: [
			{ $lt: ['$spentToday', '$dailyBudget'] },
			{ $lt: ['$spentTotal', '$totalBudget'] },
		],
	};

	if (keywords && keywords.length > 0) {
		query.keywords = { $in: keywords };
	}

	if (placement) {
		query.placements = placement;
	}

	if (categoryId) {
		query.targetCategories = categoryId;
	}

	return this.find(query).populate('product vendor');
};

export const AdCampaign = model<AdCampaignType, AdCampaignModel>('AdCampaign', AdCampaignSchema);
