import mongoose, { Schema, Document, Types } from 'mongoose';
import { getDescendantCategoryIds } from './Category';
import { z } from 'zod';
import { generateSKU, generateSlug, updateSlugHistory } from '@nearbybazaar/lib';
import { recordSlugChange } from '../services/slugHistory';

export const WarrantyDocumentZ = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
});

export const WarrantyInfoZ = z.object({
  available: z.boolean().default(true),
  providedBy: z.enum(['manufacturer', 'seller', 'brand', 'other']).default('manufacturer'),
  providerName: z.string().optional(),
  durationValue: z.number().int().positive(),
  durationUnit: z.enum(['days', 'months', 'years']).default('months'),
  coverage: z.string().optional(),
  terms: z.string().optional(),
  termsUrl: z.string().url().optional(),
  supportContact: z.string().optional(),
  serviceType: z.enum(['carry_in', 'onsite', 'pickup']).optional(),
  documents: z.array(WarrantyDocumentZ).optional(),
});

export const ProductZ = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  vendor: z.string(),
  price: z.number().min(0),
  currency: z.string().default('USD'),
  categories: z.array(z.string()).optional(),
  attributes: z
    .array(
      z.union([
        z.object({ attributeId: z.string(), value: z.any() }),
        z.object({ key: z.string(), value: z.any() }),
      ]),
    )
    .optional(),
  media: z.array(z.string()).optional(),
  model3d: z.string().url().optional(), // URL to GLTF/GLB file
  arEnabled: z.boolean().optional(),
  arMeta: z.record(z.string(), z.any()).optional(),
  variants: z
    .array(
      z.object({
        name: z.string(),
        price: z.number().min(0),
        sku: z.string().optional(),
      }),
    )
    .optional(),
  slug: z.string().optional(),
  slugHistory: z.array(z.string()).optional(),
  sku: z.string().optional(),
  deleted: z.boolean().optional(),
  warranty: WarrantyInfoZ.optional(),
});

// Mongoose document types (storage shape)
export interface ProductAttributeEntry {
  attributeId?: Types.ObjectId;
  key?: string;
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  value?: any;
}

export interface Variant {
  name: string;
  price: number;
  sku?: string;
}

export interface ProductType extends Document {
  wholesaleOnly?: boolean;
  minOrderQty?: number;
  wholesalePricing?: { minQty: number; price: number }[];
  salePrice?: number;
  saleExpiresAt?: Date;
  name: string;
  description?: string;
  vendor: Types.ObjectId;
  price: number;
  currency: string;
  categories?: Types.ObjectId[];
  attributes?: ProductAttributeEntry[];
  media?: string[];
  model3d?: string; // URL to GLTF/GLB
  arEnabled?: boolean;
  arMeta?: Record<string, any>;
  variants?: Variant[];
  slug: string;
  slugHistory?: string[];
  sku: string;
  deleted: boolean;
  // FOMO fields
  fomoEnabled?: boolean;
  fomoThreshold?: number;
  originalStock?: number;
  fomoAutoSalesThreshold?: number;
  fomoAutoStockPct?: number;
  fomoAdminOverride?: boolean;
  stock?: number;
  createdAt: Date;
  updatedAt: Date;
  warranty?: ProductWarranty;
}

export interface ProductWarrantyDocument {
  title: string;
  url: string;
  description?: string;
  uploadedAt?: Date;
  publicId?: string;
}

export interface ProductWarranty {
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
  documents?: ProductWarrantyDocument[];
}

const VariantSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  sku: { type: String },
});

const WarrantyDocumentSchema = new Schema<ProductWarrantyDocument>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    publicId: { type: String },
  },
  { _id: false },
);

const WarrantySchema = new Schema<ProductWarranty>(
  {
    available: { type: Boolean, default: true },
    providedBy: {
      type: String,
      enum: ['manufacturer', 'seller', 'brand', 'other'],
      default: 'manufacturer',
    },
    providerName: { type: String },
    durationValue: { type: Number, min: 1 },
    durationUnit: { type: String, enum: ['days', 'months', 'years'], default: 'months' },
    coverage: { type: String },
    terms: { type: String },
    termsUrl: { type: String },
    supportContact: { type: String },
    serviceType: { type: String, enum: ['carry_in', 'onsite', 'pickup'], default: 'carry_in' },
    documents: { type: [WarrantyDocumentSchema], default: undefined },
  },
  { _id: false },
);

const ProductSchema = new Schema<ProductType>(
  {
    wholesaleOnly: { type: Boolean, default: false },
    minOrderQty: { type: Number },
    wholesalePricing: [
      {
        minQty: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    salePrice: { type: Number },
    saleExpiresAt: { type: Date },
    name: { type: String, required: true, text: true },
    description: { type: String },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    // Category refs (hierarchy in Category model)
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category', index: true }],
    // Flexible attributes for faceted filtering
    attributes: [
      new Schema(
        {
          attributeId: { type: Schema.Types.ObjectId, ref: 'Attribute', index: true },
          key: { type: String, index: true }, // ad-hoc key if not using catalog Attribute
          // Store typed values – only one should be used based on attribute type
          valueString: { type: String, index: true },
          valueNumber: { type: Number, index: true },
          valueBoolean: { type: Boolean, index: true },
          // raw value kept for convenience; not indexed
          value: { type: Schema.Types.Mixed },
        },
        { _id: false },
      ),
    ],
    media: [{ type: String }],
    model3d: { type: String }, // URL to GLTF/GLB file
    arEnabled: { type: Boolean, default: false },
    arMeta: { type: Schema.Types.Mixed },
    variants: [VariantSchema],
    slug: { type: String, required: true, unique: true, index: true },
    slugHistory: [{ type: String }],
    sku: { type: String, required: true, unique: true, index: true },
    deleted: { type: Boolean, default: false },
    // FOMO badge fields
    fomoEnabled: { type: Boolean, default: false },
    fomoThreshold: { type: Number, default: 5 },
    // FOMO automation fields
    originalStock: { type: Number }, // set on product creation
    fomoAutoSalesThreshold: { type: Number, default: 10 }, // N units/day
    fomoAutoStockPct: { type: Number, default: 10 }, // percent
    fomoAdminOverride: { type: Boolean, default: false }, // if true, admin controls fomoEnabled
    warranty: WarrantySchema,
  },
  { timestamps: true },
);

// Auto-enable FOMO logic (to be called in a scheduled job or after order)
ProductSchema.methods.checkAndUpdateFomo = async function (recentSalesPerDay: number) {
  // If admin override, do not auto-toggle
  if (this.fomoAdminOverride) return;
  // Auto-enable if sales/day > threshold
  if (recentSalesPerDay >= (this.fomoAutoSalesThreshold || 10)) {
    this.fomoEnabled = true;
    return;
  }
  // Auto-enable if stock < X% of originalStock
  if (
    typeof this.originalStock === 'number' &&
    typeof this.stock === 'number' &&
    this.originalStock > 0
  ) {
    const pct = (this.stock / this.originalStock) * 100;
    if (pct <= (this.fomoAutoStockPct || 10)) {
      this.fomoEnabled = true;
      return;
    }
  }
  // Otherwise, auto-disable
  this.fomoEnabled = false;
};

// Pre-validate: ensure SKU and slug
ProductSchema.pre('validate', function (this: any, next) {
  // @ts-ignore
  if (!this.sku && this.name) {
    const primaryCategory =
      Array.isArray(this.categories) && this.categories.length > 0
        ? String(this.categories[0])
        : '';
    this.sku = generateSKU({
      name: this.name,
      category: primaryCategory,
      id: this._id?.toString(),
    });
  }
  // @ts-ignore
  if (!this.slug && this.name) {
    this.slug = generateSlug(this.name);
  }
  next();
});

// Pre-save: update slug and slugHistory if name changes
ProductSchema.pre('save', async function (this: any, next) {
  // @ts-ignore
  if (this.isModified('name')) {
    // @ts-ignore
    // @ts-ignore
    const prevSlug: string = this.slug;
    const { slug, slugHistory } = updateSlugHistory(
      this.slug,
      this.slugHistory || [],
      generateSlug(this.name),
    );
    this.slug = slug;
    this.slugHistory = slugHistory;
    if (prevSlug && slug && prevSlug !== slug) {
      try {
        await recordSlugChange({
          type: 'product',
          resourceId: this._id as any,
          oldSlug: prevSlug,
          newSlug: slug,
        });
      } catch {}
    }
  }
  next();
});

// Post-save: emit product events/logs (stub)
ProductSchema.post('save', function (_doc) {
  // TODO: emit product.created or product.updated event/log
  // e.g., eventBus.emit('product.updated', doc)
});

// Indexing hooks (best-effort; do not block save)
try {
  // Lazy require to avoid circular

  const search = require('../services/search');
  ProductSchema.post('save', function (doc: any) {
    search.indexProduct(doc).catch(() => void 0);
  });
  ProductSchema.post('deleteOne', { document: true, query: false } as any, function (this: any) {
    search.removeProduct(String(this._id)).catch(() => void 0);
  });
} catch {}

export const Product = mongoose.model<ProductType>('Product', ProductSchema);

// Helper: find products by a category including all descendants
export async function findByCategoryWithDescendants(categoryId: Types.ObjectId | string) {
  const ids = await getDescendantCategoryIds(categoryId, true);
  return Product.find({ categories: { $in: ids }, deleted: false });
}
