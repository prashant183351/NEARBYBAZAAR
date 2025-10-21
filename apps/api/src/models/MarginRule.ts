import { Schema, model, Types } from 'mongoose';

export type MarginType = 'percent' | 'fixed';

export interface MarginRule {
    _id?: Types.ObjectId;
    vendorId: Types.ObjectId;
    supplierId?: Types.ObjectId;
    category?: string;
    marginType: MarginType;
    value: number; // percent (e.g. 10 for 10%) or fixed amount
    active: boolean;
    createdAt: Date;
}

const MarginRuleSchema = new Schema<MarginRule>({
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    category: { type: String },
    marginType: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

MarginRuleSchema.index({ vendorId: 1, supplierId: 1, category: 1, active: 1 });

export default model<MarginRule>('MarginRule', MarginRuleSchema);
