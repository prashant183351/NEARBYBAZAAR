import mongoose, { Schema, Document, Types } from 'mongoose';
import { z } from 'zod';

export const AuditLogZ = z.object({
  user: z.string().optional(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  details: z.record(z.any()).optional(),
  createdAt: z.date().optional(),
});

export type AuditLogType = z.infer<typeof AuditLogZ> &
  Document & {
    user?: Types.ObjectId | string;
  };

const AuditLogSchema = new Schema<AuditLogType>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AuditLog =
  (mongoose.models.AuditLog as mongoose.Model<AuditLogType>) ||
  mongoose.model<AuditLogType>('AuditLog', AuditLogSchema);
