import { Schema, model, Types, Document } from 'mongoose';

export interface IAffiliateLedger extends Document {
  _id: Types.ObjectId;
  affiliateId: Types.ObjectId;
  type: 'click' | 'signup' | 'sale' | 'payout';
  refId?: Types.ObjectId; // e.g. userId, orderId, payoutId
  amount: number; // commission for sale/payout, 0 for click/signup
  createdAt: Date;
}

const affiliateLedgerSchema = new Schema<IAffiliateLedger>({
  affiliateId: { type: Schema.Types.ObjectId, ref: 'Affiliate', required: true },
  type: { type: String, enum: ['click', 'signup', 'sale', 'payout'], required: true },
  refId: { type: Schema.Types.ObjectId },
  amount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

affiliateLedgerSchema.index({ affiliateId: 1, type: 1 });

export const AffiliateLedger = model<IAffiliateLedger>('AffiliateLedger', affiliateLedgerSchema);
