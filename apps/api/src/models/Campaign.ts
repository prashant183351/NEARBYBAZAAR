import { Schema, model, Types, Document } from 'mongoose';

export interface ICampaign extends Document {
  _id: Types.ObjectId;
  name: string;
  type: 'promo' | 'banner' | 'ab_test';
  startDate: Date;
  endDate: Date;
  active: boolean;
  variants: Array<{
    key: string; // e.g. 'A', 'B'
    description: string;
    couponCode?: string;
    discountAmount?: number;
    bannerMessage?: string;
    trafficPercent: number; // % of users in this variant
    conversions: number;
    views: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>({
  name: { type: String, required: true },
  type: { type: String, enum: ['promo', 'banner', 'ab_test'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
  variants: [
    {
      key: { type: String, required: true },
      description: { type: String },
      couponCode: { type: String },
      discountAmount: { type: Number },
      bannerMessage: { type: String },
      trafficPercent: { type: Number, required: true },
      conversions: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
    },
  ],
}, { timestamps: true });

export const Campaign = model<ICampaign>('Campaign', campaignSchema);
