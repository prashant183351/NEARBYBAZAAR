import mongoose, { Schema, Document, Types } from 'mongoose';
import { z } from 'zod';

export const FormEntryZ = z.object({
  form: z.string(),
  data: z.record(z.string(), z.any()),
  submittedBy: z.string().optional(),
  deleted: z.boolean().optional(),
});

export type FormEntryType = z.infer<typeof FormEntryZ> &
  Document & {
    form: Types.ObjectId | string;
    submittedBy?: Types.ObjectId | string;
    createdAt?: Date;
    updatedAt?: Date;
  };

const FormEntrySchema = new Schema<FormEntryType & { version?: number }, any>(
  {
    form: { type: Schema.Types.Mixed, ref: 'Form', required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    submittedBy: { type: Schema.Types.Mixed, ref: 'User' },
    version: { type: Number },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Helper: mask value by pattern
function maskValue(val: string, pattern: string): string {
  if (pattern === 'last4') {
    return val.length > 4 ? '*'.repeat(val.length - 4) + val.slice(-4) : val;
  }
  if (pattern === 'all') {
    return '*'.repeat(val.length);
  }
  return val;
}

// Pre-save hook to mask PII
FormEntrySchema.pre('save', async function (next) {
  const entry = this as any;
  // Lookup form and fields
  const form = await mongoose.model('Form').findById(entry.form);
  if (!form) return next();
  const fields = form.fields || [];
  for (const field of fields) {
    if (field.pii) {
      const mask = field.maskPattern || 'all';
      if (entry.data && entry.data[field.id]) {
        entry.data[field.id] = maskValue(String(entry.data[field.id]), mask);
      }
    }
  }
  next();
});

export const FormEntry = mongoose.model<FormEntryType>('FormEntry', FormEntrySchema);
