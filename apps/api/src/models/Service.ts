import mongoose, { Schema, Document, Types } from 'mongoose';
import { z } from 'zod';
import { generateSKU, generateSlug, updateSlugHistory } from '@nearbybazaar/lib';
import { recordSlugChange } from '../services/slugHistory';

export const ServiceZ = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  vendor: z.string(),
  price: z.number().min(0),
  currency: z.string().default('USD'),
  duration: z.number().min(1), // in minutes
  schedule: z.any().optional(), // stub for future schedule structure
  deleted: z.boolean().optional(),
});

export interface ServiceType extends Document {
  name: string;
  description?: string;
  vendor: Types.ObjectId;
  price: number;
  currency: string;
  duration: number;
  schedule?: any;
  slug: string;
  slugHistory?: string[];
  sku: string;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<ServiceType>(
  {
    name: { type: String, required: true, text: true },
    description: { type: String },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    duration: { type: Number, required: true },
    schedule: { type: Schema.Types.Mixed },
    slug: { type: String, required: true, unique: true, index: true },
    slugHistory: [{ type: String }],
    sku: { type: String, required: true, unique: true, index: true },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Basic stub for availability calculation
ServiceSchema.methods.isAvailable = function (_date: Date) {
  // TODO: implement real schedule logic
  return true;
};

// Pre-validate: ensure SKU and slug
ServiceSchema.pre('validate', function (next) {
  // @ts-ignore
  if (!this.sku && this.name) {
    this.sku = generateSKU({ name: this.name, category: 'service', id: this._id?.toString() });
  }
  // @ts-ignore
  if (!this.slug && this.name) {
    this.slug = generateSlug(this.name);
  }
  next();
});

// Pre-save: update slug and slugHistory if name changes
ServiceSchema.pre('save', async function (next) {
  // @ts-ignore
  if (this.isModified('name')) {
    // @ts-ignore
    const prevSlug: string = (this as any).slug;
    const { slug, slugHistory } = updateSlugHistory(
      this.slug,
      this.slugHistory || [],
      generateSlug(this.name),
    );
    // @ts-ignore
    this.slug = slug;
    // @ts-ignore
    this.slugHistory = slugHistory;
    if (prevSlug && slug && prevSlug !== slug) {
      try {
        await recordSlugChange({
          type: 'service',
          resourceId: (this as any)._id,
          oldSlug: prevSlug,
          newSlug: slug,
        });
      } catch {}
    }
  }
  next();
});

// Post-save: emit service events/logs (stub)
ServiceSchema.post('save', function (_doc) {
  // TODO: emit service.created or service.updated event/log
  // e.g., eventBus.emit('service.updated', doc)
});

// Indexing hooks
try {
  const search = require('../services/search');
  ServiceSchema.post('save', function (doc: any) {
    search.indexService(doc).catch(() => void 0);
  });
  ServiceSchema.post('deleteOne', { document: true, query: false } as any, function (this: any) {
    search.removeService(String(this._id)).catch(() => void 0);
  });
} catch {}

export const Service = mongoose.model<ServiceType>('Service', ServiceSchema);
