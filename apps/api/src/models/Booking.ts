import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

export const BookingZ = z.object({
    user: z.string(),
    service: z.string(),
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).default('pending'),
    scheduledFor: z.date(),
    duration: z.number().min(1),
    price: z.number().min(0),
    tax: z.number().min(0),
    total: z.number().min(0),
    currency: z.string().default('USD'),
    amountPaid: z.number().min(0).optional(),
    category: z.string().optional(),
    vendor: z.string().optional(),
    commission: z.number().min(0).optional(),
    commissionBreakdown: z.any().optional(),
    commissionStatus: z.enum(['applied', 'pending']).optional(),
    commissionRefundable: z.boolean().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deleted: z.boolean().optional(),
});

export type BookingType = z.infer<typeof BookingZ> & Document;

const BookingSchema = new Schema<BookingType>({
    user: { type: Schema.Types.Mixed, ref: 'User', required: true, index: true },
    service: { type: Schema.Types.Mixed, ref: 'Service', required: true, index: true },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending', index: true },
    scheduledFor: { type: Date, required: true, index: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    amountPaid: { type: Number },
    category: { type: String },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    commission: { type: Number },
    commissionBreakdown: { type: Schema.Types.Mixed },
    commissionStatus: { type: String, enum: ['applied', 'pending'] },
    commissionRefundable: { type: Boolean },
    deleted: { type: Boolean, default: false },
}, { timestamps: true });

export const Booking = mongoose.model<BookingType>('Booking', BookingSchema);
