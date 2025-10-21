import { Schema, model, Document, Types } from 'mongoose';
import { generateSlug } from '@nearbybazaar/lib';

export type AttributeType = 'string' | 'number' | 'boolean' | 'enum' | 'multiselect';

export interface IAttribute extends Document {
  _id: Types.ObjectId;
  key: string; // machine key, e.g., color, size
  label: string; // display label
  slug: string;
  type: AttributeType;
  values?: string[]; // for enum/multiselect
  unit?: string; // e.g., cm, kg
  createdAt: Date;
  updatedAt: Date;
}

const AttributeSchema = new Schema<IAttribute>({
  key: { type: String, required: true, trim: true, unique: true, index: true },
  label: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['string', 'number', 'boolean', 'enum', 'multiselect'], required: true },
  values: [{ type: String }],
  unit: { type: String },
}, { timestamps: true });

AttributeSchema.pre('validate', function (next) {
  if (!this.slug) this.slug = generateSlug(this.key || this.label);
  next();
});

export const Attribute = model<IAttribute>('Attribute', AttributeSchema);
