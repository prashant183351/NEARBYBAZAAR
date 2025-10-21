import mongoose, { Schema, Document } from 'mongoose';

export interface ExperimentType extends Document {
    title: string;
    description?: string;
    ideas: string[];
    status: 'Draft' | 'Running' | 'Completed' | 'Aborted';
    statusHistory: Array<{ status: string; changedAt: Date }>;
}

const ExperimentSchema = new Schema<ExperimentType>({
    title: { type: String, required: true },
    description: { type: String },
    ideas: [{ type: Schema.Types.ObjectId, ref: 'Kaizen' }],
    status: { type: String, enum: ['Draft', 'Running', 'Completed', 'Aborted'], default: 'Draft' },
    statusHistory: [{ status: String, changedAt: Date }],
}, { timestamps: true });

// Pre-save: log status changes
ExperimentSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        this.statusHistory = this.statusHistory || [];
        this.statusHistory.push({ status: this.status, changedAt: new Date() });
        // TODO: log to AuditLog
    }
    next();
});

export const Experiment = mongoose.model<ExperimentType>('Experiment', ExperimentSchema);
