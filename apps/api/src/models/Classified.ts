import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';
import { generateSlug, updateSlugHistory } from '@nearbybazaar/lib/slug';
import { ClassifiedPlan } from './ClassifiedPlan';
import { recordSlugChange } from '../services/slugHistory';

import { Types } from 'mongoose';

export const ClassifiedZ = z.object({
    bumpScore: z.number().optional(),
    lastBump: z.date().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    vendor: z.union([z.string(), z.custom<Types.ObjectId>()]),
    status: z.enum(['active', 'expired']).default('active'),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    contactPreference: z.enum(['email', 'phone', 'none']).default('none'),
    slug: z.string().min(1),
    slugHistory: z.array(z.string()).optional(),
    expiresAt: z.date().optional(),
    deleted: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    featuredExpiry: z.date().optional(),
});

export type ClassifiedType = z.infer<typeof ClassifiedZ> & Document;

const ClassifiedSchema = new Schema<ClassifiedType>({
    bumpScore: { type: Number, default: 0 },
    lastBump: { type: Date },
    title: { type: String, required: true, text: true },
    description: { type: String },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    status: { type: String, enum: ['active', 'expired'], default: 'active', index: true },
    contactEmail: { type: String },
    contactPhone: { type: String },
    contactPreference: { type: String, enum: ['email', 'phone', 'none'], default: 'none' },
    slug: { type: String, required: true, unique: true, index: true },
    slugHistory: [{ type: String }],
    expiresAt: { type: Date },
    deleted: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    featuredExpiry: { type: Date },
}, { timestamps: true });


// Pre-validate: ensure slug
ClassifiedSchema.pre('validate', async function (next) {
    // @ts-ignore
    if (!this.slug && this.title) {
        // @ts-ignore
        this.slug = generateSlug((this as any).title);
    }
    // Set expiresAt based on plan (stub: Free=7d, Pro=30d, Featured=90d)
    // @ts-ignore
    if (!this.expiresAt && (this as any).vendor) {
        let plan = null;
        try {
            // @ts-ignore
            plan = await ClassifiedPlan.findOne({ vendor: (this as any).vendor, deleted: false }) || await ClassifiedPlan.findOne({ tier: 'Free', deleted: false });
        } catch { }
        let days = 7;
        if (plan) {
            if (plan.tier === 'Pro') days = 30;
            if (plan.tier === 'Featured') days = 90;
        }
        // @ts-ignore
        this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
    next();
});

// Pre-save: update slug and slugHistory if title changes
ClassifiedSchema.pre('save', async function (next) {
    // @ts-ignore
    if ((this as any).isModified('title')) {
        // @ts-ignore
        const prevSlug: string = (this as any).slug;
        const { slug, slugHistory } = updateSlugHistory((this as any).slug, (this as any).slugHistory || [], generateSlug((this as any).title));
        // @ts-ignore
        this.slug = slug;
        // @ts-ignore
        this.slugHistory = slugHistory;
        if (prevSlug && slug && prevSlug !== slug) {
            try {
                await recordSlugChange({ type: 'classified', resourceId: (this as any)._id, oldSlug: prevSlug, newSlug: slug });
            } catch { }
        }
    }
    next();
});

// Post-save: emit classified events/logs (stub)
ClassifiedSchema.post('save', function () {
    // TODO: emit classified.created/updated/expired event/log
    // e.g., eventBus.emit('classified.updated', this)
});

// Stub for automatic expiry
ClassifiedSchema.methods.scheduleExpiry = function () {
    // TODO: implement expiry scheduling (e.g. with a job queue)
    if (!this.expiresAt) {
        const days = 30;
        this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
};

export const Classified = mongoose.model<ClassifiedType>('Classified', ClassifiedSchema);
