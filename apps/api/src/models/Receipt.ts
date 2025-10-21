
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ReceiptType extends Document {
    vendor: Types.ObjectId | string;
    plan: Types.ObjectId | string;
    amount: number;
    currency: string;
    receiptNumber: string;
    issuedAt: Date;
    emailSent: boolean;
}

const ReceiptSchema = new Schema<ReceiptType>({
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    plan: { type: Schema.Types.ObjectId, ref: 'ClassifiedPlan', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    receiptNumber: { type: String, required: true, unique: true, index: true },
    issuedAt: { type: Date, default: Date.now },
    emailSent: { type: Boolean, default: false },
}, { timestamps: true });

export const Receipt = mongoose.model<ReceiptType>('Receipt', ReceiptSchema);
