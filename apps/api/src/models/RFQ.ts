import { Schema, model, Document, Types } from 'mongoose';

export type RFQStatus = 'open' | 'closed' | 'cancelled';

export interface RFQItem {
  product: Types.ObjectId;
  quantity: number;
}

export interface RFQType extends Document {
  buyer?: Types.ObjectId; // optional for guest submissions
  items: RFQItem[];
  deliveryLocation: string;
  neededBy?: Date;
  notes?: string;
  status: RFQStatus;
  targetVendor?: Types.ObjectId; // if aimed at a specific vendor
  category?: Types.ObjectId; // optional category broadcast
  createdAt: Date;
  updatedAt: Date;
}

const RFQItemSchema = new Schema<RFQItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const RFQSchema = new Schema<RFQType>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: 'User' },
    items: { type: [RFQItemSchema], required: true },
    deliveryLocation: { type: String, required: true },
    neededBy: { type: Date },
    notes: { type: String },
    status: { type: String, enum: ['open', 'closed', 'cancelled'], default: 'open', index: true },
    targetVendor: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
  },
  { timestamps: true },
);

export const RFQ = model<RFQType>('RFQ', RFQSchema);
