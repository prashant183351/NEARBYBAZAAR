import { Schema, model, Types } from 'mongoose';

export interface IVendorAction {
  vendor: Types.ObjectId;
  actionType: 'warning' | 'temp_suspend' | 'permanent_block';
  reason: string;
  triggeredBy: 'system' | 'admin';
  triggeredByUser?: Types.ObjectId; // Admin user if manual
  metrics: {
    orderDefectRate: number;
    lateShipmentRate: number;
    cancellationRate: number;
  };
  status: 'pending' | 'active' | 'overridden' | 'expired';
  overrideReason?: string;
  overrideBy?: Types.ObjectId;
  overrideAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const vendorActionSchema = new Schema<IVendorAction>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    actionType: {
      type: String,
      enum: ['warning', 'temp_suspend', 'permanent_block'],
      required: true,
      index: true,
    },
    reason: { type: String, required: true },
    triggeredBy: { type: String, enum: ['system', 'admin'], required: true },
    triggeredByUser: { type: Schema.Types.ObjectId, ref: 'User' },
    metrics: {
      orderDefectRate: { type: Number, required: true },
      lateShipmentRate: { type: Number, required: true },
      cancellationRate: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'overridden', 'expired'],
      default: 'pending',
      index: true,
    },
    overrideReason: String,
    overrideBy: { type: Schema.Types.ObjectId, ref: 'User' },
    overrideAt: Date,
    expiresAt: Date,
  },
  { timestamps: true },
);

// Index for efficient querying
vendorActionSchema.index({ vendor: 1, status: 1, createdAt: -1 });
vendorActionSchema.index({ status: 1, expiresAt: 1 });

export const VendorAction = model<IVendorAction>('VendorAction', vendorActionSchema);
