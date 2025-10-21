import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';
import { WarrantyInfoZ, WarrantyDocumentZ } from './Product';

export const OrderZ = z.object({
    user: z.string(),
    vendor: z.string().optional(),
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).default('pending'),
    items: z.array(z.object({
        product: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0),
        total: z.number().min(0),
        warranty: WarrantyInfoZ.extend({
            startDate: z.string().or(z.date()).optional(),
            expiryDate: z.string().or(z.date()).optional(),
            status: z.enum(['active', 'expired', 'claimed', 'void']).optional(),
            documents: z.array(WarrantyDocumentZ).optional(),
        }).partial().optional(),
    })),
    subtotal: z.number().min(0),
    tax: z.number().min(0),
    total: z.number().min(0),
    currency: z.string().default('USD'),
    
    // B2B flags
    isBulkOrder: z.boolean().default(false),
    bulkOrderType: z.enum(['wholesale', 'rfq', 'contract', 'custom']).optional(),
    businessAccount: z.boolean().default(false),
    industry: z.string().optional(), // 'manufacturing', 'retail', 'services', etc.
    region: z.string().optional(), // 'north', 'south', 'east', 'west', or specific state
    
    // Payment terms for bulk/B2B orders
    paymentTerms: z.object({
        type: z.enum(['full_advance', 'partial_advance', 'net_days', 'cod', 'custom']).optional(),
        advancePercentage: z.number().min(0).max(100).optional(),
        netDays: z.number().int().positive().optional(),
        dueDate: z.date().optional(),
        description: z.string().optional()
    }).optional(),
    
    // Credit tracking
    creditUsed: z.number().min(0).default(0),
    outstandingAmount: z.number().min(0).default(0),
    paidAmount: z.number().min(0).default(0),
    
    // Payment status
    paymentStatus: z.enum(['unpaid', 'partial', 'paid', 'overdue']).default('unpaid'),
    
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deleted: z.boolean().optional(),
});

import { Types } from 'mongoose';

export type OrderLineItemWarranty = {
    available?: boolean;
    providedBy?: 'manufacturer' | 'seller' | 'brand' | 'other';
    providerName?: string;
    durationValue?: number;
    durationUnit?: 'days' | 'months' | 'years';
    coverage?: string;
    terms?: string;
    termsUrl?: string;
    supportContact?: string;
    serviceType?: 'carry_in' | 'onsite' | 'pickup';
    documents?: Array<{ title: string; url: string; description?: string }>;
    startDate?: Date;
    expiryDate?: Date;
    status?: 'active' | 'expired' | 'claimed' | 'void';
    reminderJobId?: string;
};

export type OrderType = Omit<z.infer<typeof OrderZ>, 'user'> & {
    user: Types.ObjectId;
    hasDispute?: boolean;
    shippedAt?: Date;
    expectedDispatchDate?: Date;
    cancelledBy?: 'buyer' | 'vendor' | 'admin' | 'system';
    cancellationReason?: string;
} & Document;

const LineItemWarrantySchema = new Schema<OrderLineItemWarranty>({
    available: { type: Boolean, default: true },
    providedBy: { type: String, enum: ['manufacturer', 'seller', 'brand', 'other'] },
    providerName: { type: String },
    durationValue: { type: Number },
    durationUnit: { type: String, enum: ['days', 'months', 'years'] },
    coverage: { type: String },
    terms: { type: String },
    termsUrl: { type: String },
    supportContact: { type: String },
    serviceType: { type: String, enum: ['carry_in', 'onsite', 'pickup'] },
    documents: {
        type: [
            new Schema(
                {
                    title: { type: String, required: true },
                    url: { type: String, required: true },
                    description: { type: String },
                },
                { _id: false }
            ),
        ],
        default: undefined,
    },
    startDate: { type: Date },
    expiryDate: { type: Date },
    status: { type: String, enum: ['active', 'expired', 'claimed', 'void'], default: 'active' },
    reminderJobId: { type: String },
}, { _id: false });

const LineItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
    commission: { type: Number, default: 0 },
    commissionBreakdown: { type: Schema.Types.Mixed },
    warranty: LineItemWarrantySchema,
});

const PaymentTermsSchema = new Schema({
    type: { 
        type: String, 
        enum: ['full_advance', 'partial_advance', 'net_days', 'cod', 'custom']
    },
    advancePercentage: { type: Number, min: 0, max: 100 },
    netDays: { type: Number, min: 1 },
    dueDate: Date,
    description: String
}, { _id: false });

const OrderSchema = new Schema<OrderType>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'shipped', 'delivered', 'refunded', 'returned'], 
        default: 'pending', 
        index: true 
    },
    items: [LineItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    
    // Reputation tracking fields
    hasDispute: { type: Boolean, default: false, index: true },
    shippedAt: { type: Date },
    expectedDispatchDate: { type: Date },
    cancelledBy: { type: String, enum: ['buyer', 'vendor', 'admin', 'system'] },
    cancellationReason: { type: String },
    
    // B2B flags
    isBulkOrder: { type: Boolean, default: false, index: true },
    bulkOrderType: { 
        type: String, 
        enum: ['wholesale', 'rfq', 'contract', 'custom'],
        index: true
    },
    businessAccount: { type: Boolean, default: false, index: true },
    industry: { type: String, index: true }, // For analytics by industry
    region: { type: String, index: true }, // For regional analytics
    
    // Payment terms
    paymentTerms: PaymentTermsSchema,
    creditUsed: { type: Number, default: 0, min: 0 },
    outstandingAmount: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: { 
        type: String, 
        enum: ['unpaid', 'partial', 'paid', 'overdue'], 
        default: 'unpaid',
        index: true
    },
    
    deleted: { type: Boolean, default: false },
}, { timestamps: true });

export const Order = mongoose.model<OrderType>('Order', OrderSchema);
