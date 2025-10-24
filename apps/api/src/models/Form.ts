import mongoose, { Schema, Document, Types } from 'mongoose';
import { z } from 'zod';

export const FormZ = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(z.any()), // Could be Zod or JSON schema
  metadata: z.record(z.string(), z.any()).optional(),
  deleted: z.boolean().optional(),
});

export type FormType = z.infer<typeof FormZ> &
  Document & {
    owner: Types.ObjectId;
    ownerType: 'user' | 'vendor';
  };

const FormSchema = new Schema<FormType>(
  {
    name: { type: String, required: true },
    description: { type: String },
    fields: [{ type: Schema.Types.Mixed, required: true }],
    metadata: { type: Schema.Types.Mixed },
    deleted: { type: Boolean, default: false },
    owner: { type: Schema.Types.ObjectId, refPath: 'ownerType', required: true },
    ownerType: { type: String, enum: ['user', 'vendor'], required: true },
  },
  { timestamps: true },
);

export const Form = mongoose.model<FormType>('Form', FormSchema);
