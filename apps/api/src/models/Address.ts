import { Schema, model, Document, Types } from 'mongoose';

/**
 * Address type enum
 */
export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  BILLING = 'billing',
  SHIPPING = 'shipping',
  OTHER = 'other',
}

/**
 * Address interface
 */
export interface IAddress extends Document {
  userId: Types.ObjectId;
  type: AddressType;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Address schema
 */
const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(AddressType),
      default: AddressType.HOME,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: /^[0-9]{10}$/,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: /^[0-9]{6}$/,
      index: true,
    },
    country: {
      type: String,
      required: true,
      default: 'IN',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * Indexes
 */
addressSchema.index({ userId: 1, isDefault: 1 });
addressSchema.index({ pincode: 1, city: 1 });

/**
 * Pre-save hook: Ensure only one default address per user
 */
addressSchema.pre('save', async function (next) {
  if (this.isModified('isDefault') && this.isDefault) {
    // Unset other default addresses for this user
    await Address.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } },
    );
  }
  next();
});

/**
 * Virtual: Formatted full address
 */
addressSchema.virtual('fullAddress').get(function () {
  const parts = [
    this.addressLine1,
    this.addressLine2,
    this.landmark,
    this.city,
    this.state,
    this.pincode,
  ].filter(Boolean);

  return parts.join(', ');
});

/**
 * Method: Check if address is serviceable
 */
addressSchema.methods.isServiceable = async function (): Promise<boolean> {
  // TODO: Implement serviceability check based on pincode
  // This would check against courier service coverage, vendor locations, etc.
  return true;
};

export const Address = model<IAddress>('Address', addressSchema);
