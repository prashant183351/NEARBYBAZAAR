import mongoose, { Schema, Document } from 'mongoose';

export interface SubscriptionType extends Document {
    vendor: mongoose.Types.ObjectId;
    plan: mongoose.Types.ObjectId;
    startDate: Date;
    endDate?: Date;
    status: 'active' | 'expired' | 'pending' | 'cancelled';
    paymentRef?: string;
}

const SubscriptionSchema = new Schema<SubscriptionType>({
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    plan: { type: Schema.Types.ObjectId, ref: 'ClassifiedPlan', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'expired', 'pending', 'cancelled'], default: 'pending' },
    paymentRef: { type: String },
}, { timestamps: true });

export const Subscription = mongoose.model<SubscriptionType>('Subscription', SubscriptionSchema);
