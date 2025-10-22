import mongoose, { Schema, Document } from 'mongoose';

export interface SkuMappingType extends Document {
  supplierId: string;
  supplierSku: string;
  ourSku: string;
  createdAt: Date;
  updatedAt: Date;
  vendorId: mongoose.Types.ObjectId;
  status?: string;
}

const SkuMappingSchema = new Schema<SkuMappingType>(
  {
    supplierId: { type: String, required: true, index: true },
    supplierSku: { type: String, required: true },
    ourSku: { type: String, required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    status: { type: String, default: 'active' },
  },
  { timestamps: true },
);

SkuMappingSchema.index({ supplierId: 1, supplierSku: 1 }, { unique: true });

export const SkuMapping = mongoose.model<SkuMappingType>('SkuMapping', SkuMappingSchema);

// Conflict handling: if mapping exists for (supplierId, supplierSku), update or error
// Use @nearbybazaar/lib sku utilities to generate ourSku for new items
// Log changes to mappings for audit
