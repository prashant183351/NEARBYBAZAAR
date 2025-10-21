import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

export const CommissionZ = z.object({
    name: z.string().min(1),
    type: z.enum(['fixed', 'percentage', 'tiered']),
    value: z.number().min(0), // for fixed/percentage
    tiers: z.array(z.object({
        min: z.number().min(0),
        max: z.number().optional(),
        rate: z.number().min(0),
    })).optional(),
    category: z.string().optional(),
    vendor: z.string().optional(),
    active: z.boolean().default(true),
    deleted: z.boolean().optional(),
});

export type CommissionType = z.infer<typeof CommissionZ> & Document;

const TierSchema = new Schema({
    min: { type: Number, required: true },
    max: { type: Number },
    rate: { type: Number, required: true },
});

const CommissionSchema = new Schema<CommissionType>({
    name: { type: String, required: true },
    type: { type: String, enum: ['fixed', 'percentage', 'tiered'], required: true },
    value: { type: Number },
    tiers: [TierSchema],
    category: { type: String },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
}, { timestamps: true });

export const Commission = mongoose.model<CommissionType>('Commission', CommissionSchema);
