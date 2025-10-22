import { LoyaltyPointModel } from '../models/LoyaltyPoint';
import { LoyaltyTierModel } from '../models/LoyaltyTier';
import { LoyaltyBadgeModel } from '../models/LoyaltyBadge';
import { Types } from 'mongoose';

export type LoyaltyAction = 'purchase' | 'review' | 'referral' | 'custom';

export async function awardPoints({
  userId,
  action,
  points,
  refId,
  meta,
}: {
  userId: Types.ObjectId;
  action: LoyaltyAction;
  points: number;
  refId?: Types.ObjectId;
  meta?: Record<string, any>;
}) {
  const loyalty = await LoyaltyPointModel.findOneAndUpdate(
    { userId },
    {
      $inc: { points },
      $push: {
        history: {
          action,
          refId,
          points,
          date: new Date(),
          meta,
        },
      },
      $set: { lastEarned: new Date() },
    },
    { upsert: true, new: true },
  );
  await checkAndUpgradeTier(loyalty);
  await checkAndAwardBadges(loyalty, action);
  await updateStreak(loyalty);
  await loyalty.save();
  return loyalty;
}

export async function checkAndUpgradeTier(loyalty: any) {
  const tiers = await LoyaltyTierModel.find().sort({ order: 1 });
  let newTier = loyalty.tier;
  for (const tier of tiers) {
    if (loyalty.points >= tier.minPoints) {
      newTier = tier.name;
    }
  }
  if (loyalty.tier !== newTier) {
    loyalty.tier = newTier;
  }
}

export async function checkAndAwardBadges(loyalty: any, action: LoyaltyAction) {
  // Example: award "First Purchase" badge
  if (
    action === 'purchase' &&
    loyalty.history.filter((h: any) => h.action === 'purchase').length === 1
  ) {
    const badge = await LoyaltyBadgeModel.findOne({ name: 'First Purchase' });
    if (badge && !loyalty.badges.includes(badge.name)) {
      loyalty.badges.push(badge.name);
      badge.users.push(loyalty.userId);
      await badge.save();
    }
  }
  // Add more badge logic as needed
}

export async function updateStreak(loyalty: any) {
  // Example: streak = consecutive months with at least one purchase
  const months = new Set(
    loyalty.history
      .filter((h: any) => h.action === 'purchase')
      .map((h: any) => `${h.date.getFullYear()}-${h.date.getMonth()}`),
  );
  loyalty.streak = months.size;
}

export async function getLoyaltyStatus(userId: Types.ObjectId) {
  const loyalty = await LoyaltyPointModel.findOne({ userId });
  return loyalty;
}

export async function redeemPoints({ userId, points }: { userId: Types.ObjectId; points: number }) {
  const loyalty = await LoyaltyPointModel.findOne({ userId });
  if (!loyalty || loyalty.points < points) throw new Error('Not enough points');
  loyalty.points -= points;
  loyalty.history.push({
    action: 'custom',
    points: -points,
    date: new Date(),
    meta: { type: 'redeem' },
  });
  await loyalty.save();
  return loyalty;
}

export async function vendorAwardPoints({
  vendorId,
  userId,
  points,
  meta,
}: {
  vendorId: Types.ObjectId;
  userId: Types.ObjectId;
  points: number;
  meta?: Record<string, any>;
}) {
  // For vendor-triggered rewards (e.g. in-store event)
  return awardPoints({ userId, action: 'custom', points, meta: { ...meta, vendorId } });
}
