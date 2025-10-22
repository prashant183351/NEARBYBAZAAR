import { Schema, model, Document, Types } from 'mongoose';

export interface AdClickType extends Document {
  campaign: Types.ObjectId;
  vendor: Types.ObjectId;
  product: Types.ObjectId;
  user?: Types.ObjectId; // User who clicked (if logged in)
  sessionId?: string; // Session ID for anonymous users
  placement: string; // Where the ad was clicked
  keyword?: string; // Search keyword if clicked from search results
  cost: number; // Amount charged for this click
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  clickedAt: Date;
  convertedToOrder?: boolean; // Did this click result in an order?
  orderId?: Types.ObjectId;
}

const AdClickSchema = new Schema<AdClickType>({
  campaign: { type: Schema.Types.ObjectId, ref: 'AdCampaign', required: true, index: true },
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, index: true },
  placement: { type: String, required: true },
  keyword: { type: String, lowercase: true },
  cost: { type: Number, required: true, min: 0 },
  ipAddress: { type: String },
  userAgent: { type: String },
  referer: { type: String },
  clickedAt: { type: Date, default: Date.now, index: true },
  convertedToOrder: { type: Boolean, default: false },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
});

// Indexes for analytics
AdClickSchema.index({ campaign: 1, clickedAt: -1 });
AdClickSchema.index({ vendor: 1, clickedAt: -1 });
AdClickSchema.index({ clickedAt: -1 });
AdClickSchema.index({ convertedToOrder: 1 });

// Prevent duplicate clicks from same user/session within short timeframe (5 minutes)
AdClickSchema.index(
  { campaign: 1, user: 1, clickedAt: 1 },
  {
    unique: true,
    partialFilterExpression: { user: { $exists: true } },
    expireAfterSeconds: 300, // 5 minutes
  },
);

AdClickSchema.index(
  { campaign: 1, sessionId: 1, clickedAt: 1 },
  {
    unique: true,
    partialFilterExpression: { sessionId: { $exists: true } },
    expireAfterSeconds: 300,
  },
);

export const AdClick = model<AdClickType>('AdClick', AdClickSchema);
