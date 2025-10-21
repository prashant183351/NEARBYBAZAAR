// Campaign Manager & A/B Testing Service
import { Types } from 'mongoose';
import { Campaign } from '../models/Campaign';

// Create a campaign
export async function createCampaign(data: any) {
  return Campaign.create(data);
}

// Assign a user to a variant (simple random assignment by trafficPercent)
export async function assignVariant(campaignId: Types.ObjectId | string): Promise<string | null> {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return null;
  // For demo: assign by random weighted by trafficPercent
  const rand = Math.random() * 100;
  let acc = 0;
  for (const v of campaign.variants) {
    acc += v.trafficPercent;
    if (rand < acc) return v.key;
  }
  return campaign.variants[0]?.key || null;
}

// Track a view (e.g. banner shown)
export async function trackCampaignView(campaignId: Types.ObjectId | string, variantKey: string) {
  await Campaign.updateOne({ _id: campaignId, 'variants.key': variantKey }, { $inc: { 'variants.$.views': 1 } });
}

// Track a conversion (e.g. order placed, coupon used)
export async function trackCampaignConversion(campaignId: Types.ObjectId | string, variantKey: string) {
  await Campaign.updateOne({ _id: campaignId, 'variants.key': variantKey }, { $inc: { 'variants.$.conversions': 1 } });
}

// Get campaign stats for dashboard
export async function getCampaignStats(campaignId: Types.ObjectId | string) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return null;
  return campaign.variants.map(v => ({
    key: v.key,
    conversions: v.conversions,
    views: v.views,
    conversionRate: v.views ? v.conversions / v.views : 0,
    description: v.description,
    couponCode: v.couponCode,
    discountAmount: v.discountAmount,
    bannerMessage: v.bannerMessage,
  }));
}
