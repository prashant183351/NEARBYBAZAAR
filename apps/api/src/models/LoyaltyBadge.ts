import { Schema, model, Types } from 'mongoose';

export interface LoyaltyBadge {
  name: string;
  description: string;
  icon: string;
  criteria: string;
  users: Types.ObjectId[];
}

const LoyaltyBadgeSchema = new Schema<LoyaltyBadge>({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  criteria: { type: String, required: true },
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

export const LoyaltyBadgeModel = model<LoyaltyBadge>('LoyaltyBadge', LoyaltyBadgeSchema);
