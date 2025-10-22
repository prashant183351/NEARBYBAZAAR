/**
 * Feature #181: Pricing Rules Model
 *
 * Supports flexible pricing strategies:
 * - Coupons (code-based discounts)
 * - Automatic promotions (category/product-based)
 * - Tiered pricing (bulk discounts)
 * - Cart-level vs item-level rules
 */

import { Schema, model, Document, Types, Model } from 'mongoose';

export interface IPricingRule extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  type: 'coupon' | 'promotion' | 'tiered' | 'bundle';
  status: 'active' | 'inactive' | 'expired' | 'scheduled';

  // Coupon-specific fields
  code?: string; // e.g., "SAVE10", "NEWYEAR2025"

  // Applicability conditions
  applicableTo: {
    type: 'all' | 'category' | 'product' | 'vendor' | 'brand';
    categoryIds?: Types.ObjectId[]; // If type = 'category'
    productIds?: Types.ObjectId[]; // If type = 'product'
    vendorIds?: Types.ObjectId[]; // If type = 'vendor'
    brandIds?: Types.ObjectId[]; // If type = 'brand'
  };

  // Discount configuration
  discount: {
    type: 'percentage' | 'fixed' | 'tiered';
    value?: number; // For percentage or fixed
    tiers?: Array<{
      // For tiered pricing
      minQuantity: number;
      maxQuantity?: number; // Optional upper bound
      discountPercentage?: number; // e.g., 10 for 10% off
      discountFixed?: number; // e.g., 100 for ₹100 off
      pricePerUnit?: number; // Override price for this tier
    }>;
  };

  // Usage limits
  usageLimits: {
    maxUsageTotal?: number; // Global usage limit
    maxUsagePerUser?: number; // Per-user limit
    currentUsageTotal: number; // Track total uses
    maxDiscountAmount?: number; // Cap on discount (e.g., max ₹500 off)
    minCartValue?: number; // Min cart value to apply (e.g., ₹1000)
  };

  // Scheduling
  validFrom: Date;
  validUntil: Date;

  // Stacking rules
  stackable: boolean; // Can combine with other rules?
  stackableWith?: Types.ObjectId[]; // Specific rules it can stack with
  priority: number; // Higher priority applies first (1-100)

  // Exclusions
  excludeDiscountedItems: boolean; // Don't apply to already-discounted items
  excludeSaleItems: boolean; // Don't apply to sale items

  // Metadata
  createdBy?: Types.ObjectId; // Admin/vendor who created
  vendorId?: Types.ObjectId; // If vendor-specific rule
  isVendorRule: boolean; // Platform vs vendor rule
  tags?: string[]; // For categorization/filtering

  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isValid(): boolean;
  hasReachedUsageLimit(): boolean;
  incrementUsage(): Promise<void>;
}

const pricingRuleSchema = new Schema<IPricingRule>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['coupon', 'promotion', 'tiered', 'bundle'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired', 'scheduled'],
      default: 'active',
      index: true,
    },
    code: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true, // Unique only if present
      index: true,
    },
    applicableTo: {
      type: {
        type: String,
        enum: ['all', 'category', 'product', 'vendor', 'brand'],
        default: 'all',
      },
      categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
      vendorIds: [{ type: Schema.Types.ObjectId, ref: 'Vendor' }],
      brandIds: [{ type: Schema.Types.ObjectId, ref: 'Brand' }],
    },
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed', 'tiered'],
        required: true,
      },
      value: Number,
      tiers: [
        {
          minQuantity: { type: Number, required: true },
          maxQuantity: Number,
          discountPercentage: Number,
          discountFixed: Number,
          pricePerUnit: Number,
        },
      ],
    },
    usageLimits: {
      maxUsageTotal: Number,
      maxUsagePerUser: Number,
      currentUsageTotal: { type: Number, default: 0 },
      maxDiscountAmount: Number,
      minCartValue: Number,
    },
    validFrom: {
      type: Date,
      required: true,
      index: true,
    },
    validUntil: {
      type: Date,
      required: true,
      index: true,
    },
    stackable: {
      type: Boolean,
      default: false,
    },
    stackableWith: [{ type: Schema.Types.ObjectId, ref: 'PricingRule' }],
    priority: {
      type: Number,
      default: 50,
      min: 1,
      max: 100,
    },
    excludeDiscountedItems: {
      type: Boolean,
      default: false,
    },
    excludeSaleItems: {
      type: Boolean,
      default: false,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    isVendorRule: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: [String],
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient queries
pricingRuleSchema.index({ code: 1, status: 1 });
pricingRuleSchema.index({ type: 1, status: 1 });
pricingRuleSchema.index({ validFrom: 1, validUntil: 1 });
pricingRuleSchema.index({ 'applicableTo.type': 1, status: 1 });
pricingRuleSchema.index({ isVendorRule: 1, vendorId: 1, status: 1 });

// Unique constraint: code must be unique among active/scheduled rules
pricingRuleSchema.index(
  { code: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      code: { $exists: true },
      status: { $in: ['active', 'scheduled'] },
    },
  },
);

// Pre-save validation
pricingRuleSchema.pre('save', function (next) {
  // Validate coupon has code
  if (this.type === 'coupon' && !this.code) {
    return next(new Error('Coupon type requires a code'));
  }

  // Validate tiered pricing has tiers
  if (
    this.discount.type === 'tiered' &&
    (!this.discount.tiers || this.discount.tiers.length === 0)
  ) {
    return next(new Error('Tiered discount requires at least one tier'));
  }

  // Validate percentage/fixed has value
  if (
    (this.discount.type === 'percentage' || this.discount.type === 'fixed') &&
    !this.discount.value
  ) {
    return next(new Error(`${this.discount.type} discount requires a value`));
  }

  // Validate percentage is between 0-100
  if (
    this.discount.type === 'percentage' &&
    (this.discount.value! < 0 || this.discount.value! > 100)
  ) {
    return next(new Error('Percentage discount must be between 0 and 100'));
  }

  // Auto-expire if past validUntil
  if (this.status === 'active' && this.validUntil < new Date()) {
    this.status = 'expired';
  }

  // Auto-activate if scheduled and now past validFrom
  if (
    this.status === 'scheduled' &&
    this.validFrom <= new Date() &&
    this.validUntil >= new Date()
  ) {
    this.status = 'active';
  }

  next();
});

// Instance method: Check if rule is currently valid
pricingRuleSchema.methods.isValid = function (): boolean {
  const now = new Date();
  return this.status === 'active' && this.validFrom <= now && this.validUntil >= now;
};

// Instance method: Check if usage limit reached
pricingRuleSchema.methods.hasReachedUsageLimit = function (): boolean {
  if (
    this.usageLimits.maxUsageTotal &&
    this.usageLimits.currentUsageTotal >= this.usageLimits.maxUsageTotal
  ) {
    return true;
  }
  return false;
};

// Instance method: Increment usage counter
pricingRuleSchema.methods.incrementUsage = async function (): Promise<void> {
  await (this.constructor as Model<IPricingRule>).findByIdAndUpdate(this._id, {
    $inc: { 'usageLimits.currentUsageTotal': 1 },
  });
};

// Static method: Find valid rules by code
pricingRuleSchema.statics.findByCode = async function (code: string): Promise<IPricingRule | null> {
  return this.findOne({
    code: code.toUpperCase(),
    status: 'active',
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
  });
};

// Static method: Find active promotions (no code required)
pricingRuleSchema.statics.findActivePromotions = async function (): Promise<IPricingRule[]> {
  const now = new Date();
  return this.find({
    type: { $in: ['promotion', 'tiered'] },
    status: 'active',
    validFrom: { $lte: now },
    validUntil: { $gte: now },
  }).sort({ priority: -1 }); // Higher priority first
};

// Static method: Find applicable rules for products
pricingRuleSchema.statics.findApplicableRules = async function (
  productIds: Types.ObjectId[],
  categoryIds: Types.ObjectId[],
  vendorIds: Types.ObjectId[],
): Promise<IPricingRule[]> {
  const now = new Date();

  return this.find({
    status: 'active',
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    $or: [
      { 'applicableTo.type': 'all' },
      { 'applicableTo.type': 'product', 'applicableTo.productIds': { $in: productIds } },
      { 'applicableTo.type': 'category', 'applicableTo.categoryIds': { $in: categoryIds } },
      { 'applicableTo.type': 'vendor', 'applicableTo.vendorIds': { $in: vendorIds } },
    ],
  }).sort({ priority: -1 });
};

// Typed model interface
interface IPricingRuleModel extends Model<IPricingRule> {
  findByCode(code: string): Promise<IPricingRule | null>;
  findActivePromotions(): Promise<IPricingRule[]>;
  findApplicableRules(
    productIds: Types.ObjectId[],
    categoryIds: Types.ObjectId[],
    vendorIds: Types.ObjectId[],
  ): Promise<IPricingRule[]>;
}

export const PricingRule = model<IPricingRule, IPricingRuleModel>('PricingRule', pricingRuleSchema);
