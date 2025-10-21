import mongoose, { Schema, Document } from 'mongoose';

export interface SyncJobType extends Document {
    vendorId: string;
    jobType: string;
    status: 'pending' | 'success' | 'failed';
    startedAt: Date;
    completedAt?: Date;
    error?: string;
}

const SyncJobSchema = new Schema<SyncJobType>({
    vendorId: { type: String, required: true, index: true },
    jobType: { type: String, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], required: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    error: { type: String },
});

export const SyncJob = mongoose.model<SyncJobType>('SyncJob', SyncJobSchema);

// Usage:
// - Create SyncJob on job start
// - Update status and completedAt on finish/failure
// - Query for job history in admin UI
