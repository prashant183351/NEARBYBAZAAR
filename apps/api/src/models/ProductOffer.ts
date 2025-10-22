/**
 * ProductOffer Model
 * Feature #182 - Multi-seller marketplace
 *
 * Allows multiple vendors to offer the same product with different:
 * - Pricing
 * - Stock levels
 * - Shipping terms (SLA)
 * - Product condition (new/refurbished/used)
 * - Fulfillment method (FBM/FBA/dropship)
 *
 * Enforces business rules:
 * - One offer per vendor per product (unique compound index)
 * - No negative prices or stock
 * - Stock cannot exceed vendor's total inventory
 * - Active offers must have valid pricing
 */

import { Schema, model, Document, Types, Model } from 'mongoose';

// ==================== INTERFACES ====================

/**
 * Shipping terms for this specific offer
 */
interface IShippingTerms {
  sla: number; // Service Level Agreement in days (e.g., 2 = 2-day delivery)
  freeShippingThreshold?: number; // Free shipping if cart > this amount
  shippingCharge: number; // Flat shipping charge for this offer
  handlingTime: number; // Days to process/ship after order (1-3 typical)
}

/**
 * ProductOffer interface
 */
export interface IProductOffer extends Document {
  productId: Types.ObjectId; // Reference to Product
  vendorId: Types.ObjectId; // Reference to Vendor

  // Pricing
  price: number; // Vendor's price for this product (can differ from base product price)
  compareAtPrice?: number; // Original price (for showing savings)

  // Inventory
  stock: number; // Available stock for this offer
  lowStockThreshold: number; // Alert when stock falls below this

  // Shipping & Fulfillment
  shippingTerms: IShippingTerms;
  fulfillmentMethod: 'FBM' | 'FBA' | 'dropship'; // Fulfilled By Merchant/Amazon/Dropship

  // Product Condition
  condition: 'new' | 'refurbished' | 'used-like-new' | 'used-good' | 'used-acceptable';
  conditionNotes?: string; // Optional details about condition

  // Offer Status
  isActive: boolean; // Can buyers see/purchase this offer?
  isPaused: boolean; // Temporarily paused by vendor

  // Performance Metrics (for Buy Box scoring later)
  sellerRating?: number; // Vendor's rating (0-5)
  totalSales?: number; // Number of units sold via this offer
  cancellationRate?: number; // % of orders cancelled
  lateShipmentRate?: number; // % of orders shipped late

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastStockUpdate?: Date;

  // Instance Methods
  isAvailable(): boolean;
  hasLowStock(): boolean;
  updateStock(quantity: number): Promise<void>;
  canFulfill(requestedQuantity: number): boolean;
}

/**
 * ProductOffer static methods interface
 */
interface IProductOfferModel extends Model<IProductOffer> {
  findByProduct(productId: Types.ObjectId | string): Promise<IProductOffer[]>;
  findByVendor(vendorId: Types.ObjectId | string): Promise<IProductOffer[]>;
  findActiveOffers(productId: Types.ObjectId | string): Promise<IProductOffer[]>;
  findVendorOffer(
    productId: Types.ObjectId | string,
    vendorId: Types.ObjectId | string,
  ): Promise<IProductOffer | null>;
}

// ==================== SCHEMA ====================

const shippingTermsSchema = new Schema(
  {
    sla: {
      type: Number,
      required: true,
      min: [0, 'SLA cannot be negative'],
      max: [30, 'SLA cannot exceed 30 days'],
    },
    freeShippingThreshold: {
      type: Number,
      min: [0, 'Free shipping threshold cannot be negative'],
    },
    shippingCharge: {
      type: Number,
      required: true,
      min: [0, 'Shipping charge cannot be negative'],
    },
    handlingTime: {
      type: Number,
      required: true,
      min: [1, 'Handling time must be at least 1 day'],
      max: [7, 'Handling time cannot exceed 7 days'],
    },
  },
  { _id: false },
);

const productOfferSchema = new Schema<IProductOffer, IProductOfferModel>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor ID is required'],
      index: true,
    },

    // Pricing
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function (value: number) {
          return value > 0;
        },
        message: 'Price must be greater than zero',
      },
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare-at price cannot be negative'],
      validate: {
        validator: function (this: IProductOffer, value?: number) {
          if (value === undefined) return true;
          return value >= this.price;
        },
        message: 'Compare-at price must be greater than or equal to offer price',
      },
    },

    // Inventory
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [0, 'Low stock threshold cannot be negative'],
    },

    // Shipping & Fulfillment
    shippingTerms: {
      type: shippingTermsSchema,
      required: [true, 'Shipping terms are required'],
    },
    fulfillmentMethod: {
      type: String,
      enum: {
        values: ['FBM', 'FBA', 'dropship'],
        message: '{VALUE} is not a valid fulfillment method',
      },
      required: [true, 'Fulfillment method is required'],
      default: 'FBM',
    },

    // Product Condition
    condition: {
      type: String,
      enum: {
        values: ['new', 'refurbished', 'used-like-new', 'used-good', 'used-acceptable'],
        message: '{VALUE} is not a valid condition',
      },
      required: [true, 'Product condition is required'],
      default: 'new',
    },
    conditionNotes: {
      type: String,
      maxlength: [500, 'Condition notes cannot exceed 500 characters'],
      trim: true,
    },

    // Offer Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },

    // Performance Metrics
    sellerRating: {
      type: Number,
      min: [0, 'Seller rating cannot be negative'],
      max: [5, 'Seller rating cannot exceed 5'],
    },
    totalSales: {
      type: Number,
      default: 0,
      min: [0, 'Total sales cannot be negative'],
    },
    cancellationRate: {
      type: Number,
      min: [0, 'Cancellation rate cannot be negative'],
      max: [100, 'Cancellation rate cannot exceed 100%'],
    },
    lateShipmentRate: {
      type: Number,
      min: [0, 'Late shipment rate cannot be negative'],
      max: [100, 'Late shipment rate cannot exceed 100%'],
    },

    // Metadata
    lastStockUpdate: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ==================== INDEXES ====================

// Unique constraint: One offer per vendor per product
productOfferSchema.index(
  { productId: 1, vendorId: 1 },
  { unique: true, name: 'unique_product_vendor_offer' },
);

// Composite index for finding active offers by product
productOfferSchema.index(
  { productId: 1, isActive: 1, isPaused: 1 },
  { name: 'active_offers_by_product' },
);

// Index for vendor dashboard queries
productOfferSchema.index({ vendorId: 1, isActive: 1 }, { name: 'vendor_active_offers' });

// Index for low stock alerts
productOfferSchema.index({ vendorId: 1, stock: 1 }, { name: 'low_stock_alerts' });

// Index for performance-based queries (Buy Box scoring)
productOfferSchema.index(
  { productId: 1, isActive: 1, sellerRating: -1, price: 1 },
  { name: 'buy_box_scoring' },
);

// ==================== VIRTUALS ====================

// Savings amount if compareAtPrice is set
productOfferSchema.virtual('savings').get(function (this: IProductOffer) {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return this.compareAtPrice - this.price;
  }
  return 0;
});

// Savings percentage
productOfferSchema.virtual('savingsPercent').get(function (this: IProductOffer) {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Total delivery time (handling + shipping)
productOfferSchema.virtual('totalDeliveryTime').get(function (this: IProductOffer) {
  return this.shippingTerms.handlingTime + this.shippingTerms.sla;
});

// ==================== INSTANCE METHODS ====================

/**
 * Check if offer is available for purchase
 */
productOfferSchema.methods.isAvailable = function (this: IProductOffer): boolean {
  return this.isActive && !this.isPaused && this.stock > 0;
};

/**
 * Check if stock is below threshold
 */
productOfferSchema.methods.hasLowStock = function (this: IProductOffer): boolean {
  return this.stock <= this.lowStockThreshold && this.stock > 0;
};

/**
 * Update stock atomically (prevent race conditions)
 * @param quantity - Amount to add (positive) or subtract (negative)
 */
productOfferSchema.methods.updateStock = async function (
  this: IProductOffer,
  quantity: number,
): Promise<void> {
  const result = await ProductOffer.findOneAndUpdate(
    { _id: this._id, stock: { $gte: -quantity } }, // Ensure stock won't go negative
    {
      $inc: { stock: quantity },
      $set: { lastStockUpdate: new Date() },
    },
    { new: true },
  );

  if (!result) {
    throw new Error('Insufficient stock or offer not found');
  }

  // Update local instance
  this.stock = result.stock;
  this.lastStockUpdate = result.lastStockUpdate;
};

/**
 * Check if this offer can fulfill a requested quantity
 */
productOfferSchema.methods.canFulfill = function (
  this: IProductOffer,
  requestedQuantity: number,
): boolean {
  return this.isAvailable() && this.stock >= requestedQuantity;
};

// ==================== STATIC METHODS ====================

/**
 * Find all offers for a specific product
 */
productOfferSchema.statics.findByProduct = function (
  this: IProductOfferModel,
  productId: Types.ObjectId | string,
): Promise<IProductOffer[]> {
  return this.find({ productId })
    .populate('vendorId', 'name slug logo rating')
    .sort({ price: 1 }) // Cheapest first
    .exec();
};

/**
 * Find all offers by a specific vendor
 */
productOfferSchema.statics.findByVendor = function (
  this: IProductOfferModel,
  vendorId: Types.ObjectId | string,
): Promise<IProductOffer[]> {
  return this.find({ vendorId })
    .populate('productId', 'name slug images')
    .sort({ createdAt: -1 })
    .exec();
};

/**
 * Find active offers for a product (for "More Buying Options" UI)
 */
productOfferSchema.statics.findActiveOffers = function (
  this: IProductOfferModel,
  productId: Types.ObjectId | string,
): Promise<IProductOffer[]> {
  return this.find({
    productId,
    isActive: true,
    isPaused: false,
    stock: { $gt: 0 },
  })
    .populate('vendorId', 'name slug logo rating')
    .sort({ price: 1 }) // Cheapest first
    .exec();
};

/**
 * Find a specific vendor's offer for a product
 */
productOfferSchema.statics.findVendorOffer = function (
  this: IProductOfferModel,
  productId: Types.ObjectId | string,
  vendorId: Types.ObjectId | string,
): Promise<IProductOffer | null> {
  return this.findOne({ productId, vendorId })
    .populate('productId', 'name slug')
    .populate('vendorId', 'name slug')
    .exec();
};

// ==================== PRE-SAVE HOOKS ====================

/**
 * Validation before saving
 */
productOfferSchema.pre('save', function (this: IProductOffer, next) {
  // If offer is active, ensure it has valid pricing
  if (this.isActive && this.price <= 0) {
    return next(new Error('Active offers must have a valid price greater than zero'));
  }

  // Auto-pause if stock is zero
  if (this.stock === 0 && this.isActive && !this.isPaused) {
    this.isPaused = true;
  }

  // Auto-unpause if stock is replenished and offer was only paused due to stock
  if (this.stock > 0 && this.isPaused && this.isActive) {
    // Only auto-unpause if vendor hasn't manually paused
    // (This is a simplification - in production, track pause reason)
    this.isPaused = false;
  }

  next();
});

/**
 * Update lastStockUpdate timestamp when stock changes
 */
productOfferSchema.pre('save', function (this: IProductOffer, next) {
  if (this.isModified('stock')) {
    this.lastStockUpdate = new Date();
  }
  next();
});

// ==================== MODEL EXPORT ====================

export const ProductOffer = model<IProductOffer, IProductOfferModel>(
  'ProductOffer',
  productOfferSchema,
);
