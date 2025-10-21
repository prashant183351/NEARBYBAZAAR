import mongoose, { Schema, Document } from 'mongoose';

export type SupplierStatus = 'invited' | 'pending' | 'active' | 'suspended' | 'terminated';

export interface SupplierType extends Document {
    companyName: string;
    contactName: string;
    email: string;
    taxId: string;
    address: string;
    phone: string;
    status: SupplierStatus;
    invitedAt?: Date;
    approvedAt?: Date;
    suspendedAt?: Date;
    terminatedAt?: Date;
    kycDocs?: string[];
    vendorId: mongoose.Types.ObjectId;
    lastSyncAt?: Date;
}

const SupplierSchema = new Schema<SupplierType>({
    companyName: { type: String, required: true },
    contactName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    taxId: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    status: { type: String, enum: ['invited', 'pending', 'active', 'suspended', 'terminated'], default: 'invited' },
    invitedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    suspendedAt: { type: Date },
    terminatedAt: { type: Date },
    kycDocs: [{ type: String }], // URLs or IDs for KYC documents
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    lastSyncAt: { type: Date },
});

export const Supplier = mongoose.model<SupplierType>('Supplier', SupplierSchema);

// Lifecycle: invite -> pending -> active -> suspended/terminated
// Controllers should handle invite (email), approval, suspension, termination
