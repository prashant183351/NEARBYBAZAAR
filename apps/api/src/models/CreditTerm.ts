import { Schema, model, Document } from 'mongoose';
import { z } from 'zod';

/**
 * Payment term types for bulk orders
 */
export enum PaymentTermType {
  FULL_ADVANCE = 'full_advance',           // 100% payment upfront
  PARTIAL_ADVANCE = 'partial_advance',     // e.g., 30% advance, 70% on delivery
  NET_DAYS = 'net_days',                   // Net 30, Net 60, etc. (full credit)
  COD = 'cod',                             // Cash on delivery
  CUSTOM = 'custom'                        // Custom terms
}

/**
 * Zod schema for payment term template
 */
export const PaymentTermTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.nativeEnum(PaymentTermType),
  
  // For PARTIAL_ADVANCE
  advancePercentage: z.number().min(0).max(100).optional(),
  
  // For NET_DAYS
  netDays: z.number().int().positive().optional(),
  
  // General
  daysUntilDue: z.number().int().positive().optional(),
  lateFeePercentage: z.number().min(0).max(100).default(0),
  
  // Conditions
  minOrderValue: z.number().min(0).optional(),
  requiresApproval: z.boolean().default(true),
  isActive: z.boolean().default(true)
});

export type PaymentTermTemplateType = z.infer<typeof PaymentTermTemplateSchema>;

/**
 * Mongoose schema for payment term templates
 */
const paymentTermTemplateSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  type: { 
    type: String, 
    enum: Object.values(PaymentTermType), 
    required: true 
  },
  
  advancePercentage: { type: Number, min: 0, max: 100 },
  netDays: { type: Number, min: 1 },
  daysUntilDue: { type: Number, min: 1 },
  lateFeePercentage: { type: Number, min: 0, max: 100, default: 0 },
  
  minOrderValue: { type: Number, min: 0 },
  requiresApproval: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes
paymentTermTemplateSchema.index({ type: 1, isActive: 1 });

export interface IPaymentTermTemplate extends Document, PaymentTermTemplateType {
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentTermTemplate = model<IPaymentTermTemplate>('PaymentTermTemplate', paymentTermTemplateSchema);

/**
 * Zod schema for buyer credit approval
 */
export const BuyerCreditSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  
  // Credit limits
  creditLimit: z.number().min(0).default(0),
  availableCredit: z.number().min(0).default(0),
  
  // Usage tracking
  outstandingAmount: z.number().min(0).default(0),
  totalCreditUsed: z.number().min(0).default(0),
  
  // Approval details
  approvedBy: z.string().optional(),
  approvedAt: z.date().optional(),
  
  // Terms
  defaultPaymentTermId: z.string().optional(),
  maxNetDays: z.number().int().positive().default(30),
  
  // Risk assessment
  creditScore: z.number().min(0).max(100).optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  
  // Status
  status: z.enum(['pending', 'approved', 'suspended', 'rejected']).default('pending'),
  
  // History
  lastReviewDate: z.date().optional(),
  notes: z.string().optional()
});

export type BuyerCreditType = z.infer<typeof BuyerCreditSchema>;

/**
 * Mongoose schema for buyer credit
 */
const buyerCreditSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  
  creditLimit: { type: Number, required: true, min: 0, default: 0 },
  availableCredit: { type: Number, required: true, min: 0, default: 0 },
  
  outstandingAmount: { type: Number, required: true, min: 0, default: 0 },
  totalCreditUsed: { type: Number, required: true, min: 0, default: 0 },
  
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  
  defaultPaymentTermId: { type: Schema.Types.ObjectId, ref: 'PaymentTermTemplate' },
  maxNetDays: { type: Number, default: 30 },
  
  creditScore: { type: Number, min: 0, max: 100 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'suspended', 'rejected'], 
    default: 'pending',
    required: true
  },
  
  lastReviewDate: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes
buyerCreditSchema.index({ userId: 1 });
buyerCreditSchema.index({ status: 1 });
buyerCreditSchema.index({ approvedBy: 1 });
buyerCreditSchema.index({ riskLevel: 1 });

// Virtual for credit utilization percentage
buyerCreditSchema.virtual('utilizationPercentage').get(function() {
  if (this.creditLimit === 0) return 0;
  return (this.outstandingAmount / this.creditLimit) * 100;
});

// Method to check if credit is available
buyerCreditSchema.methods.hasAvailableCredit = function(amount: number): boolean {
  return this.status === 'approved' && this.availableCredit >= amount;
};

// Method to allocate credit (reserve for order)
buyerCreditSchema.methods.allocateCredit = async function(amount: number): Promise<boolean> {
  if (!this.hasAvailableCredit(amount)) {
    return false;
  }
  
  this.availableCredit -= amount;
  this.outstandingAmount += amount;
  await this.save();
  return true;
};

// Method to release credit (order cancelled)
buyerCreditSchema.methods.releaseCredit = async function(amount: number): Promise<void> {
  this.availableCredit = Math.min(this.creditLimit, this.availableCredit + amount);
  this.outstandingAmount = Math.max(0, this.outstandingAmount - amount);
  await this.save();
};

// Method to pay down credit (payment received)
buyerCreditSchema.methods.recordPayment = async function(amount: number): Promise<void> {
  const paidAmount = Math.min(this.outstandingAmount, amount);
  this.outstandingAmount -= paidAmount;
  this.availableCredit = Math.min(this.creditLimit, this.availableCredit + paidAmount);
  await this.save();
};

export interface IBuyerCredit extends Document, BuyerCreditType {
  createdAt: Date;
  updatedAt: Date;
  utilizationPercentage: number;
  hasAvailableCredit(amount: number): boolean;
  allocateCredit(amount: number): Promise<boolean>;
  releaseCredit(amount: number): Promise<void>;
  recordPayment(amount: number): Promise<void>;
}

export const BuyerCredit = model<IBuyerCredit>('BuyerCredit', buyerCreditSchema);
