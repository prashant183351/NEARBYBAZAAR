import { Schema, model, Document, Types } from 'mongoose';

export type SlugType = 'product' | 'service' | 'classified' | 'vendor';

export interface SlugHistoryDoc extends Document {
    type: SlugType;
    resourceId?: Types.ObjectId;
    oldSlug: string;
    newSlug: string;
    updatedAt: Date;
}

const SlugHistorySchema = new Schema<SlugHistoryDoc>({
    type: { type: String, required: true, enum: ['product', 'service', 'classified', 'vendor'], index: true },
    resourceId: { type: Schema.Types.ObjectId, index: true },
    oldSlug: { type: String, required: true, index: true },
    newSlug: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
});

// Ensure uniqueness per type+oldSlug so we always map a single old slug to the latest known next slug
SlugHistorySchema.index({ type: 1, oldSlug: 1 }, { unique: true });

export const SlugHistory = model<SlugHistoryDoc>('SlugHistory', SlugHistorySchema);
