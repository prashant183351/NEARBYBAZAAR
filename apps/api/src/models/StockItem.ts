import { Schema, model, Document, Types } from 'mongoose';

export interface IStockItem extends Document {
  productId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  sku: string;
  quantity: {
    available: number; // Available for sale
    reserved: number; // Reserved for pending orders
    damaged: number; // Damaged/unsellable
    total: number; // Total physical stock
  };
  reorderPoint?: number; // Trigger reorder when available falls below
  reorderQuantity?: number; // How much to order
  lastRestocked?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const stockItemSchema = new Schema<IStockItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    quantity: {
      available: { type: Number, default: 0, min: 0 },
      reserved: { type: Number, default: 0, min: 0 },
      damaged: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0, min: 0 },
    },
    reorderPoint: Number,
    reorderQuantity: Number,
    lastRestocked: Date,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one stock record per product per warehouse
stockItemSchema.index({ productId: 1, warehouseId: 1 }, { unique: true });

// Index for low stock queries
stockItemSchema.index({ 'quantity.available': 1, reorderPoint: 1 });

// Index for SKU lookup
stockItemSchema.index({ sku: 1, warehouseId: 1 });

// Pre-save hook to maintain total quantity integrity
stockItemSchema.pre('save', function (next) {
  const expected = this.quantity.available + this.quantity.reserved + this.quantity.damaged;
  if (this.quantity.total !== expected) {
    this.quantity.total = expected;
  }
  next();
});

// Static methods for atomic operations

/**
 * Atomically reserve stock from a specific warehouse
 * Returns updated stock item or null if insufficient stock
 */
stockItemSchema.statics.reserveStock = async function (
  productId: Types.ObjectId | string,
  warehouseId: Types.ObjectId | string,
  quantity: number
): Promise<IStockItem | null> {
  if (quantity <= 0) throw new Error('Quantity must be positive');

  const result = await this.findOneAndUpdate(
    {
      productId,
      warehouseId,
      'quantity.available': { $gte: quantity }, // Only if enough available
    },
    {
      $inc: {
        'quantity.available': -quantity,
        'quantity.reserved': quantity,
      },
    },
    {
      new: true, // Return updated document
      runValidators: true,
    }
  );

  return result;
};

/**
 * Atomically release reserved stock back to available
 */
stockItemSchema.statics.releaseReservation = async function (
  productId: Types.ObjectId | string,
  warehouseId: Types.ObjectId | string,
  quantity: number
): Promise<IStockItem | null> {
  if (quantity <= 0) throw new Error('Quantity must be positive');

  const result = await this.findOneAndUpdate(
    {
      productId,
      warehouseId,
      'quantity.reserved': { $gte: quantity }, // Only if enough reserved
    },
    {
      $inc: {
        'quantity.available': quantity,
        'quantity.reserved': -quantity,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return result;
};

/**
 * Atomically commit reserved stock (convert to sold)
 * This reduces total stock (item actually shipped)
 */
stockItemSchema.statics.commitReservation = async function (
  productId: Types.ObjectId | string,
  warehouseId: Types.ObjectId | string,
  quantity: number
): Promise<IStockItem | null> {
  if (quantity <= 0) throw new Error('Quantity must be positive');

  const result = await this.findOneAndUpdate(
    {
      productId,
      warehouseId,
      'quantity.reserved': { $gte: quantity },
    },
    {
      $inc: {
        'quantity.reserved': -quantity,
        'quantity.total': -quantity,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return result;
};

/**
 * Add new stock to warehouse (e.g., after purchase order received)
 */
stockItemSchema.statics.addStock = async function (
  productId: Types.ObjectId | string,
  warehouseId: Types.ObjectId | string,
  quantity: number
): Promise<IStockItem> {
  if (quantity <= 0) throw new Error('Quantity must be positive');

  const result = await this.findOneAndUpdate(
    { productId, warehouseId },
    {
      $inc: {
        'quantity.available': quantity,
        'quantity.total': quantity,
      },
      $set: { lastRestocked: new Date() },
    },
    {
      new: true,
      upsert: true, // Create if doesn't exist
      runValidators: true,
    }
  );

  return result;
};

/**
 * Mark stock as damaged (removes from available, adds to damaged)
 */
stockItemSchema.statics.markDamaged = async function (
  productId: Types.ObjectId | string,
  warehouseId: Types.ObjectId | string,
  quantity: number
): Promise<IStockItem | null> {
  if (quantity <= 0) throw new Error('Quantity must be positive');

  const result = await this.findOneAndUpdate(
    {
      productId,
      warehouseId,
      'quantity.available': { $gte: quantity },
    },
    {
      $inc: {
        'quantity.available': -quantity,
        'quantity.damaged': quantity,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return result;
};

/**
 * Get total available stock across all warehouses for a product
 */
stockItemSchema.statics.getTotalAvailable = async function (
  productId: Types.ObjectId | string
): Promise<number> {
  const result = await this.aggregate([
    { $match: { productId: new Types.ObjectId(productId as string) } },
    { $group: { _id: null, total: { $sum: '$quantity.available' } } },
  ]);

  return result[0]?.total || 0;
};

/**
 * Find best warehouse for fulfillment (e.g., nearest with stock)
 */
stockItemSchema.statics.findBestWarehouse = async function (
  productId: Types.ObjectId | string,
  quantity: number,
  preferredPincode?: string
): Promise<IStockItem | null> {
  const query: any = {
    productId,
    'quantity.available': { $gte: quantity },
  };

  // If preferred pincode provided, prioritize nearby warehouses
  // (simplified: just check exact match, real impl would use geo proximity)
  const items = await this.find(query)
    .populate('warehouseId')
    .sort({ 'quantity.available': -1 }); // Sort by available stock

  if (!items.length) return null;

  if (preferredPincode) {
    const match = items.find(
      (item: any) => item.warehouseId?.address?.pincode === preferredPincode
    );
    if (match) return match;
  }

  return items[0]; // Return first (highest stock)
};

export const StockItem = model<IStockItem>('StockItem', stockItemSchema);
