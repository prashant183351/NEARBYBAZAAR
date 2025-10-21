
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface DecisionType extends Document {
    title: string;
    description?: string;
    idea?: Types.ObjectId | string;
    experiment?: Types.ObjectId | string;
    madeBy: Types.ObjectId | string;
    madeAt: Date;
    immutable: boolean;
    editHistory: Array<{ editedAt: Date; editor: Types.ObjectId | string; changes: any }>;
}

const DecisionSchema = new Schema<DecisionType>({
    title: { type: String, required: true },
    description: { type: String },
    idea: { type: Schema.Types.ObjectId, ref: 'Kaizen' },
    experiment: { type: Schema.Types.ObjectId, ref: 'Experiment' },
    madeBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    madeAt: { type: Date, default: Date.now },
    immutable: { type: Boolean, default: true },
    editHistory: [{ editedAt: Date, editor: String, changes: Schema.Types.Mixed }],
}, { timestamps: true });

// Pre-save: prevent edits if immutable
DecisionSchema.pre('save', function (next) {
    if (this.isModified() && this.immutable) {
        return next(new Error('Immutable decisions cannot be edited.'));
    }
    next();
});

export const Decision = mongoose.model<DecisionType>('Decision', DecisionSchema);
