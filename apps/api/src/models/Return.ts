import { Schema, model, Types } from 'mongoose';

export type ReturnStatus =
  | 'requested' // Customer initiated return request
  | 'vendor_reviewing' // Vendor is reviewing the request
  | 'vendor_approved' // Vendor approved, waiting for supplier approval (if dropship)
  | 'vendor_rejected' // Vendor rejected the return
  | 'supplier_reviewing' // Supplier is reviewing (for dropship orders)
  | 'supplier_approved' // Supplier approved the return
  | 'supplier_rejected' // Supplier rejected the return
  | 'return_label_sent' // Return shipping label sent to customer
  | 'shipped_back' // Customer shipped item back
  | 'in_transit' // Return package in transit
  | 'received_by_vendor' // Vendor received the return
  | 'received_by_supplier' // Supplier received the return (dropship)
  | 'inspecting' // Item being inspected for condition
  | 'inspection_passed' // Item passed inspection
  | 'inspection_failed' // Item failed inspection (damaged/not as described)
  | 'refund_processing' // Refund is being processed
  | 'refunded' // Refund completed
  | 'partially_refunded' // Partial refund issued
  | 'replaced' // Item replaced instead of refunded
  | 'closed' // Return case closed
  | 'cancelled'; // Return request cancelled

export type ReturnReason =
  | 'defective'
  | 'wrong_item'
  | 'not_as_described'
  | 'changed_mind'
  | 'damaged_in_shipping'
  | 'sizing_issue'
  | 'quality_issue'
  | 'arrived_late'
  | 'other';

export type RefundMethod = 'original_payment' | 'store_credit' | 'replacement' | 'partial_refund';

export interface ReturnItem {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  quantity: number;
  reason: ReturnReason;
  condition?: string; // Description of item condition
  images?: string[]; // URLs of item photos for proof
}

export interface ReturnInspection {
  inspectedBy: Types.ObjectId; // vendor or supplier user
  inspectorType: 'vendor' | 'supplier';
  inspectedAt: Date;
  passed: boolean;
  notes?: string;
  images?: string[];
}

export interface ReturnShipment {
  carrier?: string;
  trackingNumber?: string;
  shippedAt?: Date;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  labelUrl?: string; // Pre-paid return label
  labelCost?: number; // Who pays: vendor or customer
}

export interface ReturnRefund {
  method: RefundMethod;
  amount: number;
  currency: string;
  transactionId?: string;
  processedAt?: Date;
  notes?: string;
}

export interface Return {
  _id?: Types.ObjectId;
  rmaNumber: string; // Unique RMA number (e.g., "RMA-2025-001234")
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  vendorId: Types.ObjectId;
  supplierId?: Types.ObjectId; // For dropship orders

  // Return details
  items: ReturnItem[];
  status: ReturnStatus;
  isDropship: boolean;

  // Communication trail
  customerNotes?: string;
  vendorNotes?: string;
  supplierNotes?: string;
  internalNotes?: string; // Private notes, not visible to customer

  // Shipment details
  returnShipment?: ReturnShipment;

  // Inspection
  inspection?: ReturnInspection;

  // Refund details
  refund?: ReturnRefund;

  // Approval/rejection
  vendorApprovedBy?: Types.ObjectId;
  vendorApprovedAt?: Date;
  vendorRejectedAt?: Date;
  vendorRejectionReason?: string;

  supplierApprovedBy?: Types.ObjectId;
  supplierApprovedAt?: Date;
  supplierRejectedAt?: Date;
  supplierRejectionReason?: string;

  // Timeline
  requestedAt: Date;
  expectedResolutionDate?: Date;
  resolvedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Adding missing fields to the Return interface
  restockingFee: number;
}

const ReturnItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
    quantity: { type: Number, required: true, min: 1 },
    reason: {
      type: String,
      enum: [
        'defective',
        'wrong_item',
        'not_as_described',
        'changed_mind',
        'damaged_in_shipping',
        'sizing_issue',
        'quality_issue',
        'arrived_late',
        'other',
      ],
      required: true,
    },
    condition: { type: String },
    images: [{ type: String }],
  },
  { _id: false },
);

const ReturnInspectionSchema = new Schema(
  {
    inspectedBy: { type: Schema.Types.ObjectId, required: true },
    inspectorType: { type: String, enum: ['vendor', 'supplier'], required: true },
    inspectedAt: { type: Date, default: Date.now },
    passed: { type: Boolean, required: true },
    notes: { type: String },
    images: [{ type: String }],
  },
  { _id: false },
);

const ReturnShipmentSchema = new Schema(
  {
    carrier: { type: String },
    trackingNumber: { type: String },
    shippedAt: { type: Date },
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date },
    labelUrl: { type: String },
    labelCost: { type: Number },
  },
  { _id: false },
);

const ReturnRefundSchema = new Schema(
  {
    method: {
      type: String,
      enum: ['original_payment', 'store_credit', 'replacement', 'partial_refund'],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    transactionId: { type: String },
    processedAt: { type: Date },
    notes: { type: String },
  },
  { _id: false },
);

const ReturnSchema = new Schema<Return>({
  rmaNumber: { type: String, required: true, unique: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },

  items: [ReturnItemSchema],
  status: {
    type: String,
    enum: [
      'requested',
      'vendor_reviewing',
      'vendor_approved',
      'vendor_rejected',
      'supplier_reviewing',
      'supplier_approved',
      'supplier_rejected',
      'return_label_sent',
      'shipped_back',
      'in_transit',
      'received_by_vendor',
      'received_by_supplier',
      'inspecting',
      'inspection_passed',
      'inspection_failed',
      'refund_processing',
      'refunded',
      'partially_refunded',
      'replaced',
      'closed',
      'cancelled',
    ],
    default: 'requested',
  },
  isDropship: { type: Boolean, default: false },

  customerNotes: { type: String },
  vendorNotes: { type: String },
  supplierNotes: { type: String },
  internalNotes: { type: String },

  returnShipment: ReturnShipmentSchema,
  inspection: ReturnInspectionSchema,
  refund: ReturnRefundSchema,

  vendorApprovedBy: { type: Schema.Types.ObjectId },
  vendorApprovedAt: { type: Date },
  vendorRejectedAt: { type: Date },
  vendorRejectionReason: { type: String },

  supplierApprovedBy: { type: Schema.Types.ObjectId },
  supplierApprovedAt: { type: Date },
  supplierRejectedAt: { type: Date },
  supplierRejectionReason: { type: String },

  // Consolidating and fixing field definitions
  restockingFee: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },

  requestedAt: { type: Date, default: Date.now },
  expectedResolutionDate: { type: Date },
  resolvedAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
});

// Indexes
ReturnSchema.index({ orderId: 1 });
ReturnSchema.index({ customerId: 1, status: 1 });
ReturnSchema.index({ vendorId: 1, status: 1 });
ReturnSchema.index({ supplierId: 1, status: 1 });
ReturnSchema.index({ requestedAt: -1 });
ReturnSchema.index({ status: 1, requestedAt: -1 });

// Auto-update updatedAt
ReturnSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Generate RMA number before saving
ReturnSchema.pre('save', async function (next) {
  if (!this.rmaNumber) {
    const year = new Date().getFullYear();
    const count = await model('Return').countDocuments();
    this.rmaNumber = `RMA-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default model<Return>('Return', ReturnSchema);
