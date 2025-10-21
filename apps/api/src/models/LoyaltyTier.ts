import { Schema, model } from 'mongoose';

export interface LoyaltyTier {
  name: string;
  minPoints: number;
  benefits: string[];
  order: number;
}

const LoyaltyTierSchema = new Schema<LoyaltyTier>({
  name: { type: String, required: true, unique: true },
  minPoints: { type: Number, required: true },
  benefits: [{ type: String }],
  order: { type: Number, required: true },
});

export const LoyaltyTierModel = model<LoyaltyTier>('LoyaltyTier', LoyaltyTierSchema);
