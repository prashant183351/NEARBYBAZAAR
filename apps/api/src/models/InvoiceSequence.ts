import { Schema, model, Document, Types } from 'mongoose';

export interface InvoiceSequenceDoc extends Document {
  vendorId?: Types.ObjectId;
  fy: string; // e.g., FY24-25
  current: number;
  prefix?: string;
  updatedAt: Date;
}

const InvoiceSequenceSchema = new Schema<InvoiceSequenceDoc>({
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
  fy: { type: String, required: true, index: true },
  current: { type: Number, default: 0 },
  prefix: { type: String },
}, { timestamps: { createdAt: false, updatedAt: true } });

InvoiceSequenceSchema.index({ vendorId: 1, fy: 1 }, { unique: true });

export const InvoiceSequence = model<InvoiceSequenceDoc>('InvoiceSequence', InvoiceSequenceSchema);
