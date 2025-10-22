import mongoose, { Schema, Document, Types } from 'mongoose';

export interface CommissionEntry extends Document {
  orderId: Types.ObjectId;
  lineItemId?: Types.ObjectId;
  vendorId?: Types.ObjectId;
  amount: number; // positive for commission charged, negative for reversal
  currency: string;
  reason: 'charge' | 'refund' | 'adjustment';
  meta?: Record<string, any>;
  createdAt: Date;
}

const CommissionLedgerSchema = new Schema<CommissionEntry>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    lineItemId: { type: Schema.Types.ObjectId },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    reason: { type: String, enum: ['charge', 'refund', 'adjustment'], required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

CommissionLedgerSchema.index({ orderId: 1, createdAt: -1 });

export const CommissionLedger = mongoose.model<CommissionEntry>(
  'CommissionLedger',
  CommissionLedgerSchema,
);
