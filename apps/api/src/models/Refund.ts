import { Schema, model } from 'mongoose';

const refundSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order' },
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  buyer: { type: Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  createdAt: { type: Date, default: Date.now },
  reason: String,
});

export const Refund = model('Refund', refundSchema);
