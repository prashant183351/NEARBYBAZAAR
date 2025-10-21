/**
 * Payout Model
 * 
 * Manages vendor payout tracking and settlement.
 * Payouts can only be processed for KYC-verified vendors.
 * 
 * Calculation:
 * Payout Amount = Order Total - Platform Commission - Refunds - Adjustments
 * 
 * Status Flow:
 * pending → processing → completed OR failed
 */

import { Schema, model, Document, Types } from 'mongoose';

/**
 * Payout Status Enum
 */
export enum PayoutStatus {
  PENDING = 'pending',         // Awaiting processing
  PROCESSING = 'processing',   // Payment in progress
  COMPLETED = 'completed',     // Successfully paid
  FAILED = 'failed',           // Payment failed
  CANCELLED = 'cancelled',     // Cancelled by admin
  ON_HOLD = 'on_hold',        // Held due to dispute or investigation
}

/**
 * Payout Method Enum
 */
export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',     // NEFT/RTGS/IMPS
  UPI = 'upi',                         // UPI transfer
  WALLET = 'wallet',                   // Platform wallet
  CHEQUE = 'cheque',                   // Physical cheque
}

/**
 * Payout Frequency Enum
 */
export enum PayoutFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  ON_DEMAND = 'on_demand',
}

/**
 * Line Item for Payout (breakdown)
 */
export interface IPayoutLineItem {
  orderId: Types.ObjectId;
  orderNumber?: string;
  orderDate: Date;
  orderTotal: number;          // Total order value
  commission: number;          // Platform commission
  tax: number;                 // Tax (GST if applicable)
  refundAmount: number;        // Any refunds issued
  netAmount: number;           // Final amount for this order
}

/**
 * Adjustment Entry (manual corrections)
 */
export interface IPayoutAdjustment {
  type: 'debit' | 'credit';
  amount: number;
  reason: string;
  reference?: string;          // Reference ID (e.g., dispute ID)
  createdBy: Types.ObjectId;   // Admin who created adjustment
  createdAt: Date;
}

/**
 * Payout Status History
 */
export interface IPayoutStatusHistory {
  status: PayoutStatus;
  changedBy: Types.ObjectId;
  changedAt: Date;
  notes?: string;
  failureReason?: string;      // If status is FAILED
}

/**
 * Payout Document Interface
 */
export interface IPayout extends Document {
  _id: Types.ObjectId;
  vendorId: Types.ObjectId;
  
  // Payout Details
  payoutNumber: string;        // Unique payout reference (e.g., PO-2025-000001)
  status: PayoutStatus;
  statusHistory: IPayoutStatusHistory[];
  
  // Financial Breakdown
  lineItems: IPayoutLineItem[];
  
  grossAmount: number;         // Sum of all order totals
  totalCommission: number;     // Sum of all commissions
  totalRefunds: number;        // Sum of all refunds
  adjustments: IPayoutAdjustment[];
  totalAdjustments: number;    // Net adjustments (credits - debits)
  netAmount: number;           // Final payout amount
  
  // Payment Details
  method: PayoutMethod;
  bankAccountId?: Types.ObjectId;  // Reference to vendor's bank account
  upiId?: string;
  transactionId?: string;      // Bank/UPI transaction ID
  transactionDate?: Date;
  
  // Period
  periodStart: Date;           // Payout period start
  periodEnd: Date;             // Payout period end
  
  // Processing
  scheduledAt?: Date;          // When payout is scheduled
  processedAt?: Date;          // When payment was initiated
  completedAt?: Date;          // When payment was confirmed
  failedAt?: Date;
  failureReason?: string;
  
  // Flags
  isKYCVerified: boolean;      // Snapshot of KYC status at creation
  requiresManualReview: boolean; // Flag for admin review
  
  // Metadata
  notes?: string;
  internalNotes?: string;      // Admin-only notes
  
  // Audit
  createdBy?: Types.ObjectId;  // Admin who created (for manual payouts)
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculateTotals(): void;
  process(adminId: Types.ObjectId, transactionId: string): Promise<void>;
  markCompleted(transactionDate: Date): Promise<void>;
  markFailed(reason: string): Promise<void>;
  addAdjustment(adjustment: Omit<IPayoutAdjustment, 'createdAt'>): Promise<void>;
}

/**
 * Payout Schema
 */
const payoutLineItemSchema = new Schema<IPayoutLineItem>({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  orderNumber: String,
  orderDate: {
    type: Date,
    required: true,
  },
  orderTotal: {
    type: Number,
    required: true,
  },
  commission: {
    type: Number,
    required: true,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  netAmount: {
    type: Number,
    required: true,
  },
}, { _id: false });

const payoutAdjustmentSchema = new Schema<IPayoutAdjustment>({
  type: {
    type: String,
    enum: ['debit', 'credit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  reference: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const payoutStatusHistorySchema = new Schema<IPayoutStatusHistory>({
  status: {
    type: String,
    enum: Object.values(PayoutStatus),
    required: true,
  },
  changedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  notes: String,
  failureReason: String,
}, { _id: false });

const payoutSchema = new Schema<IPayout>({
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true,
  },
  payoutNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(PayoutStatus),
    default: PayoutStatus.PENDING,
    index: true,
  },
  statusHistory: [payoutStatusHistorySchema],
  lineItems: {
    type: [payoutLineItemSchema],
    default: [],
  },
  grossAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  totalCommission: {
    type: Number,
    required: true,
    default: 0,
  },
  totalRefunds: {
    type: Number,
    default: 0,
  },
  adjustments: {
    type: [payoutAdjustmentSchema],
    default: [],
  },
  totalAdjustments: {
    type: Number,
    default: 0,
  },
  netAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  method: {
    type: String,
    enum: Object.values(PayoutMethod),
    default: PayoutMethod.BANK_TRANSFER,
  },
  bankAccountId: {
    type: Schema.Types.ObjectId,
  },
  upiId: String,
  transactionId: String,
  transactionDate: Date,
  periodStart: {
    type: Date,
    required: true,
    index: true,
  },
  periodEnd: {
    type: Date,
    required: true,
    index: true,
  },
  scheduledAt: Date,
  processedAt: Date,
  completedAt: Date,
  failedAt: Date,
  failureReason: String,
  isKYCVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  requiresManualReview: {
    type: Boolean,
    default: false,
    index: true,
  },
  notes: String,
  internalNotes: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

/**
 * Indexes
 */
payoutSchema.index({ vendorId: 1, status: 1 });
payoutSchema.index({ status: 1, scheduledAt: 1 });
payoutSchema.index({ periodStart: 1, periodEnd: 1 });
payoutSchema.index({ createdAt: -1 });

/**
 * Methods
 */

/**
 * Calculate all totals based on line items and adjustments
 */
payoutSchema.methods.calculateTotals = function(this: IPayout): void {
  // Sum up line items
  this.grossAmount = this.lineItems.reduce((sum, item) => sum + item.orderTotal, 0);
  this.totalCommission = this.lineItems.reduce((sum, item) => sum + item.commission, 0);
  this.totalRefunds = this.lineItems.reduce((sum, item) => sum + item.refundAmount, 0);
  
  // Calculate adjustments (credits increase, debits decrease)
  this.totalAdjustments = this.adjustments.reduce((sum, adj) => {
    return sum + (adj.type === 'credit' ? adj.amount : -adj.amount);
  }, 0);
  
  // Net amount = Gross - Commission - Refunds + Adjustments
  this.netAmount = this.grossAmount - this.totalCommission - this.totalRefunds + this.totalAdjustments;
  
  // Ensure net amount is not negative
  if (this.netAmount < 0) {
    this.netAmount = 0;
  }
};

/**
 * Process payout (initiate payment)
 */
payoutSchema.methods.process = async function(
  this: IPayout,
  adminId: Types.ObjectId,
  transactionId: string
): Promise<void> {
  if (this.status !== PayoutStatus.PENDING) {
    throw new Error(`Cannot process payout from status: ${this.status}`);
  }

  if (!this.isKYCVerified) {
    throw new Error('Cannot process payout: KYC not verified');
  }

  if (this.netAmount <= 0) {
    throw new Error('Cannot process payout: Net amount must be positive');
  }

  this.status = PayoutStatus.PROCESSING;
  this.transactionId = transactionId;
  this.processedAt = new Date();

  this.statusHistory.push({
    status: PayoutStatus.PROCESSING,
    changedBy: adminId,
    changedAt: new Date(),
    notes: `Payment initiated with transaction ID: ${transactionId}`,
  });

  await this.save();

  // TODO: Integrate with payment gateway API
  // TODO: Send notification to vendor
};

/**
 * Mark payout as completed
 */
payoutSchema.methods.markCompleted = async function(
  this: IPayout,
  transactionDate: Date
): Promise<void> {
  if (this.status !== PayoutStatus.PROCESSING) {
    throw new Error(`Cannot complete payout from status: ${this.status}`);
  }

  this.status = PayoutStatus.COMPLETED;
  this.completedAt = new Date();
  this.transactionDate = transactionDate;

  this.statusHistory.push({
    status: PayoutStatus.COMPLETED,
    changedBy: this.vendorId, // System/automated
    changedAt: new Date(),
    notes: 'Payment successfully completed',
  });

  await this.save();

  // TODO: Send confirmation email to vendor
  // TODO: Generate payout receipt/statement
};

/**
 * Mark payout as failed
 */
payoutSchema.methods.markFailed = async function(
  this: IPayout,
  reason: string
): Promise<void> {
  if (this.status !== PayoutStatus.PROCESSING) {
    throw new Error(`Cannot mark failed from status: ${this.status}`);
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error('Failure reason is required');
  }

  this.status = PayoutStatus.FAILED;
  this.failedAt = new Date();
  this.failureReason = reason;

  this.statusHistory.push({
    status: PayoutStatus.FAILED,
    changedBy: this.vendorId, // System/automated
    changedAt: new Date(),
    failureReason: reason,
  });

  await this.save();

  // TODO: Send notification to vendor and admin
  // TODO: Create new payout for retry (if applicable)
};

/**
 * Add an adjustment to the payout
 */
payoutSchema.methods.addAdjustment = async function(
  this: IPayout,
  adjustment: Omit<IPayoutAdjustment, 'createdAt'>
): Promise<void> {
  if (this.status !== PayoutStatus.PENDING) {
    throw new Error('Can only add adjustments to pending payouts');
  }

  if (!adjustment.amount || adjustment.amount <= 0) {
    throw new Error('Adjustment amount must be positive');
  }

  this.adjustments.push({
    ...adjustment,
    createdAt: new Date(),
  } as IPayoutAdjustment);

  // Recalculate totals
  this.calculateTotals();

  await this.save();
};

/**
 * Static Methods
 */

/**
 * Generate unique payout number
 */
payoutSchema.statics.generatePayoutNumber = async function(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;
  
  // Find the last payout number for this year
  const lastPayout = await this.findOne({
    payoutNumber: new RegExp(`^${prefix}`),
  })
    .sort({ payoutNumber: -1 })
    .limit(1);

  let nextNumber = 1;
  if (lastPayout) {
    const lastNumber = parseInt(lastPayout.payoutNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros (6 digits)
  const paddedNumber = String(nextNumber).padStart(6, '0');
  return `${prefix}${paddedNumber}`;
};

/**
 * Pre-save middleware
 */
payoutSchema.pre('save', function(next) {
  // Recalculate totals before saving
  if (this.isModified('lineItems') || this.isModified('adjustments')) {
    this.calculateTotals();
  }

  next();
});

/**
 * Export Payout Model
 */
export const Payout = model<IPayout>('Payout', payoutSchema);
