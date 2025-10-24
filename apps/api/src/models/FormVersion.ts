import mongoose, { Schema, Document, Types } from 'mongoose';
import { z } from 'zod';

export const FormVersionZ = z.object({
  form: z.string(),
  version: z.number(),
  fields: z.array(z.any()),
  metadata: z.record(z.string(), z.any()).optional(),
  publishedAt: z.date(),
  state: z.enum(['draft', 'published']).default('draft'),
});

export type FormVersionType = z.infer<typeof FormVersionZ> &
  Document & {
    form: Types.ObjectId | string;
  };

const FormVersionSchema = new Schema<FormVersionType>(
  {
    form: { type: Schema.Types.Mixed, ref: 'Form', required: true },
    version: { type: Number, required: true },
    fields: [{ type: Schema.Types.Mixed, required: true }],
    metadata: { type: Schema.Types.Mixed },
    publishedAt: { type: Date },
    state: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true },
);

export const FormVersion = mongoose.model<FormVersionType>('FormVersion', FormVersionSchema);
