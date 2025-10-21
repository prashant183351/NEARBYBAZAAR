import { Schema, model, Document } from 'mongoose';

export interface IWarehouse extends Document {
  code: string; // Unique identifier (e.g., WH-DEL-01)
  name: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  capacity?: number; // Max SKUs or volume
  isActive: boolean;
  operatingHours?: {
    days: string[]; // ['Mon', 'Tue', ...]
    openTime: string; // '09:00'
    closeTime: string; // '18:00'
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const warehouseSchema = new Schema<IWarehouse>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      addressLine1: { type: String, required: true },
      addressLine2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, required: true, default: 'India' },
    },
    contactPerson: String,
    contactPhone: String,
    contactEmail: String,
    capacity: Number,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    operatingHours: {
      days: [String],
      openTime: String,
      closeTime: String,
    },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
warehouseSchema.index({ 'address.city': 1, isActive: 1 });
warehouseSchema.index({ 'address.pincode': 1, isActive: 1 });

// Methods
warehouseSchema.methods.isOperating = function (date?: Date): boolean {
  if (!this.isActive) return false;
  if (!this.operatingHours) return true; // No hours set = always operating

  const checkDate = date || new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDay = dayNames[checkDate.getDay()];

  if (!this.operatingHours.days.includes(currentDay)) return false;

  // Simple time check (assumes same timezone)
  const currentTime = checkDate.toTimeString().substring(0, 5); // HH:MM
  return (
    currentTime >= this.operatingHours.openTime &&
    currentTime <= this.operatingHours.closeTime
  );
};

export const Warehouse = model<IWarehouse>('Warehouse', warehouseSchema);
