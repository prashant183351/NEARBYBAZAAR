import { Schema, model, Document, Types } from 'mongoose';
import { ulid } from 'ulid';

export enum ReservationStatus {
  RESERVED = 'reserved',
  CONFIRMED = 'confirmed',
  RELEASED = 'released',
  EXPIRED = 'expired',
}

export interface IStockReservation extends Document {
  orderId?: Types.ObjectId;
  cartId?: string;
  userId?: Types.ObjectId;
  productId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  sku: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date;
  committedAt?: Date;
  releasedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  reservationId: string;
  variantId?: string;
  isValid(): boolean;
  isExpired(): boolean;
  commit(): Promise<IStockReservation>;
  release(): Promise<IStockReservation>;
  expire(): Promise<IStockReservation>;
}

const stockReservationSchema = new Schema<IStockReservation>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    cartId: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(ReservationStatus),
      default: ReservationStatus.RESERVED,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    committedAt: Date,
    releasedAt: Date,
    metadata: Schema.Types.Mixed,
    reservationId: {
      type: String,
      required: true,
      default: () => ulid(),
      unique: true,
    },
    variantId: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound indexes for common queries
// Compound indexes for common queries
// Compound indexes for common queries
stockReservationSchema.index({ status: 1, expiresAt: 1 }); // For cleanup job
stockReservationSchema.index({ orderId: 1, status: 1 });
stockReservationSchema.index({ cartId: 1, status: 1 });
stockReservationSchema.index({ productId: 1, warehouseId: 1, status: 1 });
stockReservationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
// Virtuals
stockReservationSchema.virtual('isActive').get(function (this: IStockReservation) {
  return this.status === ReservationStatus.RESERVED;
});

stockReservationSchema.virtual('timeRemaining').get(function (this: IStockReservation) {
  return Math.max(0, Math.floor((this.expiresAt.getTime() - Date.now()) / 1000));
});

// Instance methods

/**
 * Check if reservation is still valid
 */

stockReservationSchema.methods.isValid = function (): boolean {
  return this.status === ReservationStatus.RESERVED && this.expiresAt > new Date();
};

/**
 * Check if reservation has expired
 */

stockReservationSchema.methods.isExpired = function (): boolean {
  return this.status === ReservationStatus.RESERVED && this.expiresAt <= new Date();
};

/**
 * Commit this reservation (order confirmed)
 */
stockReservationSchema.methods.commit = async function (): Promise<IStockReservation> {
  if (this.status !== 'active') {
    throw new Error(`Cannot commit reservation with status: ${this.status}`);
  }

  this.status = 'committed';
  this.committedAt = new Date();
  return await this.save();
};

/**
 * Release this reservation (cart abandoned or order cancelled)
 */
stockReservationSchema.methods.release = async function (): Promise<IStockReservation> {
  if (this.status === 'committed') {
    throw new Error('Cannot release committed reservation');
  }

  this.status = 'released';
  this.releasedAt = new Date();
  return await this.save();
};

/**
 * Mark as expired
 */
stockReservationSchema.methods.expire = async function (): Promise<IStockReservation> {
  if (this.status !== 'active') return this as IStockReservation;

  this.status = 'expired';
  return await this.save();
};

// Static methods

/**
 * Create a new reservation with stock atomicity
 */
stockReservationSchema.statics.createReservation = async function (params: {
  productId: Types.ObjectId | string;
  warehouseId: Types.ObjectId | string;
  sku: string;
  quantity: number;
  orderId?: Types.ObjectId | string;
  cartId?: string;
  userId?: Types.ObjectId | string;
  expiryMinutes?: number;
}): Promise<IStockReservation> {
  const { StockItem } = require('./StockItem');

  const expiryMinutes = params.expiryMinutes || 15; // Default 15 minutes
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Atomically reserve stock
  const stockItem = await StockItem.reserveStock(
    params.productId,
    params.warehouseId,
    params.quantity,
  );

  if (!stockItem) {
    throw new Error('Insufficient stock available');
  }

  // Create reservation record
  const reservation = await this.create({
    productId: params.productId,
    warehouseId: params.warehouseId,
    sku: params.sku,
    quantity: params.quantity,
    orderId: params.orderId,
    cartId: params.cartId,
    userId: params.userId,
    status: 'active',
    expiresAt,
  });

  return reservation;
};

/**
 * Release a reservation and return stock
 */
stockReservationSchema.statics.releaseReservation = async function (
  reservationId: Types.ObjectId | string,
): Promise<void> {
  const { StockItem } = require('./StockItem');

  const reservation = await this.findById(reservationId);
  if (!reservation) {
    throw new Error('Reservation not found');
  }

  if (reservation.status === 'committed') {
    throw new Error('Cannot release committed reservation');
  }

  if (reservation.status !== 'active') {
    return; // Already released or expired
  }

  // Atomically release stock back to available
  await StockItem.releaseReservation(
    reservation.productId,
    reservation.warehouseId,
    reservation.quantity,
  );

  // Update reservation status
  await reservation.release();
};

/**
 * Commit a reservation (order confirmed)
 */
stockReservationSchema.statics.commitReservation = async function (
  reservationId: Types.ObjectId | string,
): Promise<void> {
  const { StockItem } = require('./StockItem');

  const reservation = await this.findById(reservationId);
  if (!reservation) {
    throw new Error('Reservation not found');
  }

  if (reservation.status !== 'active') {
    throw new Error(`Cannot commit reservation with status: ${reservation.status}`);
  }

  if (reservation.isExpired()) {
    throw new Error('Reservation has expired');
  }

  // Atomically commit stock (reduces total inventory)
  await StockItem.commitReservation(
    reservation.productId,
    reservation.warehouseId,
    reservation.quantity,
  );

  // Update reservation status
  await reservation.commit();
};

/**
 * Find and release all expired reservations
 * Returns count of released reservations
 */
stockReservationSchema.statics.releaseExpiredReservations = async function (): Promise<number> {
  const { StockItem } = require('./StockItem');

  const expiredReservations = await this.find({
    status: 'active',
    expiresAt: { $lte: new Date() },
  });

  let releasedCount = 0;

  for (const reservation of expiredReservations) {
    try {
      // Release stock atomically
      await StockItem.releaseReservation(
        reservation.productId,
        reservation.warehouseId,
        reservation.quantity,
      );

      // Mark as expired
      await reservation.expire();
      releasedCount++;
    } catch (error) {
      console.error(`Failed to release reservation ${reservation._id}:`, error);
    }
  }

  return releasedCount;
};

/**
 * Release all reservations for a cart (e.g., cart abandoned)
 */
stockReservationSchema.statics.releaseCartReservations = async function (
  cartId: string,
): Promise<number> {
  const reservations = await this.find({
    cartId,
    status: 'active',
  });

  let releasedCount = 0;

  for (const reservation of reservations) {
    try {
      const StockReservationModel = model<IStockReservation>('StockReservation');
      await StockReservationModel.schema.statics.releaseReservation.call(
        StockReservationModel,
        reservation._id,
      );
      releasedCount++;
    } catch (error) {
      console.error(`Failed to release cart reservation ${reservation._id}:`, error);
    }
  }

  return releasedCount;
};

export const StockReservation = model<IStockReservation>(
  'StockReservation',
  stockReservationSchema,
);
