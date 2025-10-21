import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

export const MediaZ = z.object({
    cloudinaryId: z.string().min(1),
    url: z.string().url(),
    alt: z.string().min(1),
    exifStripped: z.boolean().optional(),
    uploadedBy: z.string().optional(),
    deleted: z.boolean().optional(),
});

export type MediaType = z.infer<typeof MediaZ> & Document;


const MediaSchema = new Schema<MediaType & {
    thumbUrl?: string;
    webpUrl?: string;
    variants?: Record<string, string>;
}>({
    cloudinaryId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    alt: { type: String, required: true },
    exifStripped: { type: Boolean, default: false },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deleted: { type: Boolean, default: false },
    thumbUrl: { type: String, default: '' },
    webpUrl: { type: String, default: '' },
    variants: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Stub for EXIF stripping logic
MediaSchema.methods.stripExif = function () {
    // TODO: integrate EXIF stripping pipeline
    this.exifStripped = true;
};

export const Media = mongoose.model<MediaType>('Media', MediaSchema);
