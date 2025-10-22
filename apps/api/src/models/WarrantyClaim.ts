import { Schema, model, Document, Types } from 'mongoose';
import { OrderLineItemWarranty } from './Order';

export type WarrantyClaimStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'resolved';

export interface WarrantyClaimAttachment {
  url: string;
  title?: string;
  description?: string;
}

export interface WarrantyClaimType extends Document {
  orderId: Types.ObjectId;
  lineItemId: Types.ObjectId;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  vendorId?: Types.ObjectId;
  issueDescription: string;
  preferredContact?: string;
  status: WarrantyClaimStatus;
  attachments?: WarrantyClaimAttachment[];
  warrantySnapshot?: OrderLineItemWarranty;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<WarrantyClaimAttachment>(
  {
    url: { type: String, required: true },
    title: { type: String },
    description: { type: String },
  },
  { _id: false },
);

const WarrantyClaimSchema = new Schema<WarrantyClaimType>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    lineItemId: { type: Schema.Types.ObjectId, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
    issueDescription: { type: String, required: true },
    preferredContact: { type: String },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'approved', 'rejected', 'resolved'],
      default: 'pending',
      index: true,
    },
    attachments: { type: [AttachmentSchema], default: undefined },
    warrantySnapshot: { type: Schema.Types.Mixed },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

export const WarrantyClaim = model<WarrantyClaimType>('WarrantyClaim', WarrantyClaimSchema);
