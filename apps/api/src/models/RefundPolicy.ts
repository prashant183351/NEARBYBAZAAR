import mongoose, { Schema, Document } from 'mongoose';

export interface RefundPolicyType extends Document {
    text: string;
    daysWindow: number;
    active: boolean;
}

const RefundPolicySchema = new Schema<RefundPolicyType>({
    text: { type: String, required: true },
    daysWindow: { type: Number, required: true },
    active: { type: Boolean, default: true },
}, { timestamps: true });

export const RefundPolicy = mongoose.model<RefundPolicyType>('RefundPolicy', RefundPolicySchema);
