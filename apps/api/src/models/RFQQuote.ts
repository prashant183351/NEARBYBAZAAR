import { Schema, model, Document, Types } from 'mongoose';

export type RFQQuoteStatus = 'proposed' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';

export interface RFQQuoteType extends Document {
  rfq: Types.ObjectId;
  vendor: Types.ObjectId;
  unitPrice: number;
  minOrderQty?: number;
  leadTimeDays?: number;
  validUntil?: Date;
  notes?: string;
  status: RFQQuoteStatus;
  revisions: number;
  createdAt: Date;
  updatedAt: Date;
}

const RFQQuoteSchema = new Schema<RFQQuoteType>({
  rfq: { type: Schema.Types.ObjectId, ref: 'RFQ', required: true, index: true },
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  unitPrice: { type: Number, required: true, min: 0 },
  minOrderQty: { type: Number },
  leadTimeDays: { type: Number },
  validUntil: { type: Date },
  notes: { type: String },
  status: { type: String, enum: ['proposed', 'accepted', 'rejected', 'withdrawn', 'expired'], default: 'proposed', index: true },
  revisions: { type: Number, default: 0 },
}, { timestamps: true });

export const RFQQuote = model<RFQQuoteType>('RFQQuote', RFQQuoteSchema);
