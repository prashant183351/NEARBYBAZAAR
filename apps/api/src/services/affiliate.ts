// Affiliate & Influencer Tracking Service
import { Types } from 'mongoose';
import { Affiliate } from '../models/Affiliate';
import { AffiliateLedger } from '../models/AffiliateLedger';
// import { User } from '../models/User';
// import { Order } from '../models/Order';

// Generate a unique referral code for a user
export async function generateReferralCode(userId: Types.ObjectId | string): Promise<string> {
  const code = (Math.random().toString(36).substring(2, 8) + userId.toString().slice(-4)).toUpperCase();
  await Affiliate.create({ userId, code });
  return code;
}

// Track a click on a referral link
export async function trackAffiliateClick(code: string) {
  const affiliate = await Affiliate.findOneAndUpdate({ code }, { $inc: { clicks: 1 } });
  if (affiliate) await AffiliateLedger.create({ affiliateId: affiliate._id, type: 'click', amount: 0 });
}

// Track a signup via referral
export async function trackAffiliateSignup(code: string, newUserId: Types.ObjectId | string) {
  const affiliate = await Affiliate.findOneAndUpdate({ code }, { $inc: { signups: 1 } });
  if (affiliate) await AffiliateLedger.create({ affiliateId: affiliate._id, type: 'signup', refId: newUserId, amount: 0 });
}

// Track a sale via referral
export async function trackAffiliateSale(code: string, orderId: Types.ObjectId | string, commission: number) {
  const affiliate = await Affiliate.findOneAndUpdate({ code }, { $inc: { sales: 1, commissionEarned: commission } });
  if (affiliate) await AffiliateLedger.create({ affiliateId: affiliate._id, type: 'sale', refId: orderId, amount: commission });
}

// Record a payout to affiliate
export async function recordAffiliatePayout(affiliateId: Types.ObjectId | string, amount: number) {
  await Affiliate.findByIdAndUpdate(affiliateId, { $inc: { commissionPaid: amount } });
  await AffiliateLedger.create({ affiliateId, type: 'payout', amount });
}

// Get affiliate dashboard data
export async function getAffiliateDashboard(userId: Types.ObjectId | string) {
  const affiliate = await Affiliate.findOne({ userId });
  if (!affiliate) return null;
  const ledger = await AffiliateLedger.find({ affiliateId: affiliate._id });
  return { ...affiliate.toObject(), ledger };
}
