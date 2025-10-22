import { Schema, model, Types, Document } from 'mongoose';

export interface IAffiliate extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // The affiliate user
  code: string; // Unique referral code
  clicks: number;
  signups: number;
  sales: number;
  commissionEarned: number;
  commissionPaid: number;
  createdAt: Date;
  updatedAt: Date;
}

const affiliateSchema = new Schema<IAffiliate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    code: { type: String, required: true, unique: true },
    clicks: { type: Number, default: 0 },
    signups: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    commissionEarned: { type: Number, default: 0 },
    commissionPaid: { type: Number, default: 0 },
  },
  { timestamps: true },
);

affiliateSchema.index({ code: 1 }, { unique: true });

export const Affiliate = model<IAffiliate>('Affiliate', affiliateSchema);
