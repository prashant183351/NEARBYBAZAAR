import { Schema, model } from 'mongoose';

const ReferralSchema = new Schema({
  referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  referredId: { type: Schema.Types.ObjectId, ref: 'User' },
  referralCode: { type: String, unique: true, required: true },
  type: { type: String, enum: ['buyer', 'seller'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'invalid'], default: 'pending' },
  reward: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const Referral = model('Referral', ReferralSchema);