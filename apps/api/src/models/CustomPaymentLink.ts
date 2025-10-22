import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomPaymentLink extends Document {
  vendorId: string;
  orderId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
}

const CustomPaymentLinkSchema: Schema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'PAID', 'EXPIRED'], default: 'PENDING' },
  },
  {
    timestamps: true,
  },
);

export const CustomPaymentLink = mongoose.model<ICustomPaymentLink>(
  'CustomPaymentLink',
  CustomPaymentLinkSchema,
);
