import { Schema, model, Document } from 'mongoose';

export interface ABTestType extends Document {
  name: string;
  description?: string;
  feature: 'fomo' | 'urgency' | 'badge' | 'other';
  enabled: boolean;
  scope: 'global' | 'category' | 'product';
  category?: string; // category id if scope is category
  product?: string; // product id if scope is product
  variantA: {
    label: string;
    config: Record<string, any>;
    users: number;
    conversions: number;
  };
  variantB: {
    label: string;
    config: Record<string, any>;
    users: number;
    conversions: number;
  };
  startedAt: Date;
  endedAt?: Date;
}

const ABTestSchema = new Schema<ABTestType>({
  name: { type: String, required: true },
  description: { type: String },
  feature: { type: String, enum: ['fomo', 'urgency', 'badge', 'other'], required: true },
  enabled: { type: Boolean, default: true },
  scope: { type: String, enum: ['global', 'category', 'product'], default: 'global' },
  category: { type: String },
  product: { type: String },
  variantA: {
    label: { type: String, required: true },
    config: { type: Schema.Types.Mixed },
    users: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
  },
  variantB: {
    label: { type: String, required: true },
    config: { type: Schema.Types.Mixed },
    users: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
  },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

export const ABTest = model<ABTestType>('ABTest', ABTestSchema);
