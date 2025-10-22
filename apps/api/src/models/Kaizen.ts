import mongoose, { Schema, Document, Types } from 'mongoose';
import { z } from 'zod';

export const KaizenZ = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  owners: z.array(z.string()).optional(),
  reach: z.number().min(0).optional(),
  impact: z.number().min(0).optional(),
  confidence: z.number().min(0).optional(),
  effort: z.number().min(0).optional(),
  riceScore: z.number().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string(),
        filename: z.string().optional(),
        mimetype: z.string().optional(),
        size: z.number().optional(),
        uploadedAt: z.date().optional(),
      }),
    )
    .optional(),
  deleted: z.boolean().optional(),
});

export type KaizenType = z.infer<typeof KaizenZ> &
  Document & {
    owners?: Array<Types.ObjectId | string>;
    privateNotes?: Array<{ note: string; author?: Types.ObjectId | string; createdAt?: Date }>;
    attachments?: Array<{
      url: string;
      filename?: string;
      mimetype?: string;
      size?: number;
      uploadedAt?: Date;
    }>;
  };

const KaizenSchema = new Schema<KaizenType>(
  {
    privateNotes: [
      {
        note: { type: String, required: true },
        author: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    title: { type: String, required: true, text: true },
    description: { type: String },
    tags: [{ type: String, text: true }],
    owners: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    reach: { type: Number, default: 1 },
    impact: { type: Number, default: 1 },
    confidence: { type: Number, default: 1 },
    effort: { type: Number, default: 1 },
    riceScore: { type: Number, default: 1 },
    attachments: [
      {
        url: { type: String, required: true },
        filename: { type: String },
        mimetype: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);
// Pre-save: compute RICE score
KaizenSchema.pre('save', function (next) {
  // @ts-ignore
  this.riceScore =
    ((this.reach || 1) * (this.impact || 1) * (this.confidence || 1)) / (this.effort || 1);
  next();
});

export const Kaizen = mongoose.model<KaizenType>('Kaizen', KaizenSchema);
