import { Schema, model, Types } from 'mongoose';

export interface LoyaltyPoint {
  userId: Types.ObjectId;
  points: number;
  history: Array<{
    action: 'purchase' | 'review' | 'referral' | 'custom';
    refId?: Types.ObjectId;
    points: number;
    date: Date;
    meta?: Record<string, any>;
  }>;
  tier: string;
  badges: string[];
  streak: number;
  lastEarned: Date;
}

const LoyaltyPointSchema = new Schema<LoyaltyPoint>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  points: { type: Number, default: 0 },
  history: [
    {
      action: { type: String, enum: ['purchase', 'review', 'referral', 'custom'], required: true },
      refId: { type: Schema.Types.ObjectId },
      points: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      meta: { type: Schema.Types.Mixed },
    },
  ],
  tier: { type: String, default: 'Bronze' },
  badges: [{ type: String }],
  streak: { type: Number, default: 0 },
  lastEarned: { type: Date },
});

// Updated method to include explicit parameter types
LoyaltyPointSchema.methods.awardPoints = async function (
  action: 'purchase' | 'review' | 'referral' | 'custom',
  refId: Types.ObjectId | undefined,
  points: number,
  meta: Record<string, any> = {}
) {
  this.points += points;
  this.history.push({ action, refId, points, date: new Date(), meta });
  this.lastEarned = new Date();
  await this.save();
};

export const LoyaltyPointModel = model<LoyaltyPoint>('LoyaltyPoint', LoyaltyPointSchema);
