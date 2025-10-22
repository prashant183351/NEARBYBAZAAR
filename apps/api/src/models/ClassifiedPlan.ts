import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

export const ClassifiedPlanZ = z.object({
  name: z.string().min(1),
  tier: z.enum(['Free', 'Pro', 'Featured']),
  maxListings: z.number().min(1),
  features: z.array(z.string()).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().default('USD').optional(),
  deleted: z.boolean().optional(),
});

export type ClassifiedPlanType = z.infer<typeof ClassifiedPlanZ> & Document;

const ClassifiedPlanSchema = new Schema<ClassifiedPlanType>(
  {
    name: { type: String, required: true },
    tier: { type: String, enum: ['Free', 'Pro', 'Featured'], required: true, index: true },
    maxListings: { type: Number, required: true },
    features: [{ type: String }],
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const ClassifiedPlan = mongoose.model<ClassifiedPlanType>(
  'ClassifiedPlan',
  ClassifiedPlanSchema,
);
