import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';
import { generateSlug, dedupeSlug, updateSlugHistory } from '@nearbybazaar/lib/slug';
import { recordSlugChange } from '../services/slugHistory';

export const VendorZ = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  owner: z.string(), // User id
  deleted: z.boolean().optional(),
  slug: z.string().optional(),
  slugHistory: z.array(z.string()).optional(),
  status: z.enum(['active', 'suspended', 'blocked']).optional(),
  language: z.string().optional(),
});

export type VendorType = z.infer<typeof VendorZ> & Document;

const MAX_LOGO_SIZE = 512 * 1024; // 512 KB

// Use a broad schema type to avoid TS mismatch between zod and mongoose ObjectId types
const VendorSchema = new Schema<any>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deleted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'suspended', 'blocked'],
      default: 'active',
      index: true,
    },
    logoUrl: { type: String, default: '' },
    logoPublicId: { type: String, default: '' },
    slug: { type: String, required: true, unique: true, index: true },
    slugHistory: [{ type: String }],
    customSection: { type: String, default: '' }, // Markdown content for custom section
    language: { type: String, default: 'en' },
    policies: {
      type: [
        {
          version: { type: Number, default: 1 },
          updatedAt: { type: Date, default: Date.now },
          return: { type: String, default: '' }, // Markdown
          terms: { type: String, default: '' }, // Markdown
          privacy: { type: String, default: '' }, // Markdown
        },
      ],
      default: [],
    },
    averageRating: { type: Number, default: 0 }, // Aggregate average rating
    reviewCount: { type: Number, default: 0 }, // Total number of reviews
    storeViews: { type: Number, default: 0 }, // Store page view count
    codEnabled: { type: Boolean, default: false }, // Can this vendor accept COD?
    kycDocs: [
      {
        url: String,
        encrypted: Boolean,
        iv: String,
        watermarked: Boolean,
        ocrVerified: Boolean,
        ocrData: Schema.Types.Mixed,
      },
    ],
    avgPayout: { type: Number, default: 0 }, // Average payout for the vendor

    // Added fields for UPI QR payments
    upiVpa: { type: String, default: '' }, // Vendor's UPI Virtual Payment Address
    upiQrCode: { type: String, default: '' }, // URL to the vendor's UPI QR code image
    upiEnabled: { type: Boolean, default: false }, // Whether UPI payments are enabled for this vendor
  },
  { timestamps: true },
);

// Logo validation middleware (to be used in upload controller)
// This is a placeholder for actual validation logic
VendorSchema.statics.validateLogo = function (file: any) {
  if (!file) throw new Error('No logo file provided');
  if (file.size > MAX_LOGO_SIZE) throw new Error('Logo file too large');
  // Optionally: check image dimensions/ratio using sharp or similar
  // ...
  return true;
};

// Virtual: fallback initials avatar if no logo
VendorSchema.virtual('logoFallback').get(function (this: any) {
  if (this.logoUrl) return this.logoUrl;
  // Generate initials avatar (e.g. via UI or a service)
  const initials = (this.name || '')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  // Example: use a service like https://ui-avatars.com/
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=128`;
});

// Static: find an available unique slug for this vendor (overridable in tests)
(VendorSchema.statics as any).findUniqueSlug = async function (
  self: any,
  base: string,
): Promise<string> {
  const VendorModel = this as mongoose.Model<any>;
  const regex = new RegExp(`^${base}(?:-\\d+)?$`, 'i');
  const query: any = { slug: { $regex: regex } };
  if (self._id) {
    query._id = { $ne: self._id };
  }
  const docs = await VendorModel.find(query).select('slug').lean();
  const existing = new Set<string>(docs.map((d: any) => String(d.slug)));
  return dedupeSlug(base, existing);
};

// Pre-validate: ensure slug exists, and if name changed update slug + history
VendorSchema.pre('validate', async function (next) {
  try {
    const self = this as any;
    const VendorModel = self.constructor;
    if (self.isModified && self.isModified('name')) {
      const currentSlug: string = self.slug || '';
      const base = generateSlug(self.name);
      const seed = base || generateSlug(self.email || self.owner?.toString?.() || 'vendor');
      const unique = await VendorModel.findUniqueSlug(self, seed);
      const historyArr: string[] = Array.isArray(self.slugHistory) ? self.slugHistory : [];
      const { slug, slugHistory } = updateSlugHistory(currentSlug, historyArr, unique);
      self.slug = slug;
      self.slugHistory = slugHistory;
      if (currentSlug && slug && currentSlug !== slug) {
        try {
          await recordSlugChange({
            type: 'vendor',
            resourceId: self._id,
            oldSlug: currentSlug,
            newSlug: slug,
          });
        } catch {}
      }
    } else if (!self.slug && self.name) {
      const base = generateSlug(self.name);
      const seed = base || generateSlug(self.email || self.owner?.toString?.() || 'vendor');
      self.slug = await VendorModel.findUniqueSlug(self, seed);
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

export const Vendor = mongoose.model<VendorType>('Vendor', VendorSchema);
