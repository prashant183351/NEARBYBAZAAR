import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

export const UserZ = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: z.enum(['user', 'vendor', 'admin']),
    deleted: z.boolean().optional(),
    isBusiness: z.boolean().optional(),
    businessProfile: z
        .object({
            companyName: z.string().min(1),
            gstin: z.string().min(5).optional(),
            pan: z.string().min(5).optional(),
            address: z.string().optional(),
        })
        .optional(),
    lastFingerprint: z.string().optional(),
    riskScore: z.number().optional(),
});

export type UserType = z.infer<typeof UserZ> & Document;

const UserSchema = new Schema<UserType>({
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['user', 'vendor', 'admin'], required: true },
    deleted: { type: Boolean, default: false },
    isBusiness: { type: Boolean, default: false },
    businessProfile: {
        companyName: { type: String },
        gstin: { type: String },
        pan: { type: String },
        address: { type: String },
    },
    lastFingerprint: { type: String, default: '' },
    riskScore: { type: Number, default: 0 },
}, { timestamps: true });

export const User = mongoose.model<UserType>('User', UserSchema);
