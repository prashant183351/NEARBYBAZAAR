/**
 * Payout Service
 *
 * Manages vendor payout calculations and processing.
 * Ensures KYC verification before payouts.
 *
 * Payout Calculation:
 * Net Payout = Gross Sales - Commission - Refunds + Adjustments
 */

import { Types } from 'mongoose';
import { Payout, IPayout, PayoutStatus, PayoutMethod, IPayoutLineItem } from '../models/Payout';
import { verifyKYCForPayouts } from './kyc';

/**
 * Configuration
 */
const MIN_PAYOUT_AMOUNT = parseFloat(process.env.MIN_PAYOUT_AMOUNT || '100'); // Minimum ₹100
const MAX_PAYOUT_AMOUNT = parseFloat(process.env.MAX_PAYOUT_AMOUNT || '1000000'); // Max ₹10L

/**
 * Payout Summary
 */
export interface IPayoutSummary {
  totalPayouts: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalPendingAmount: number;
  totalCompletedAmount: number;
}

/**
 * Payout Calculation Result
 */
export interface IPayoutCalculation {
  vendorId: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  grossAmount: number;
  totalCommission: number;
  totalRefunds: number;
  netAmount: number;
  orderCount: number;
  lineItems: IPayoutLineItem[];
}

/**
 * Calculate payout for vendor for a given period
 *
 * @param vendorId - Vendor ObjectId
 * @param periodStart - Start of payout period
 * @param periodEnd - End of payout period
 * @returns Payout calculation breakdown
 */
export async function calculatePayoutForVendor(
  vendorId: Types.ObjectId,
  periodStart: Date,
  periodEnd: Date,
): Promise<IPayoutCalculation> {
  // TODO: In production, fetch actual orders from Order model
  // For now, return stub data

  // Simulated calculation (replace with actual Order aggregation)
  const lineItems: IPayoutLineItem[] = [
    // Example line item
    // {
    //   orderId: new Types.ObjectId(),
    //   orderNumber: 'ORD-2025-000123',
    //   orderDate: new Date(),
    //   orderTotal: 1000,
    //   commission: 100, // 10%
    //   tax: 180,
    //   refundAmount: 0,
    //   netAmount: 900,
    // },
  ];

  const grossAmount = lineItems.reduce((sum, item) => sum + item.orderTotal, 0);
  const totalCommission = lineItems.reduce((sum, item) => sum + item.commission, 0);
  const totalRefunds = lineItems.reduce((sum, item) => sum + item.refundAmount, 0);
  const netAmount = grossAmount - totalCommission - totalRefunds;

  return {
    vendorId,
    periodStart,
    periodEnd,
    grossAmount,
    totalCommission,
    totalRefunds,
    netAmount,
    orderCount: lineItems.length,
    lineItems,
  };
}

/**
 * Create a payout for vendor
 *
 * @param vendorId - Vendor ObjectId
 * @param calculation - Payout calculation result
 * @param method - Payment method
 * @returns Created payout
 */
export async function createPayout(
  vendorId: Types.ObjectId,
  calculation: IPayoutCalculation,
  method: PayoutMethod = PayoutMethod.BANK_TRANSFER,
): Promise<IPayout> {
  // Verify KYC status
  const isKYCVerified = await verifyKYCForPayouts(vendorId);

  if (!isKYCVerified) {
    throw new Error('Cannot create payout: Vendor KYC not verified');
  }

  // Validate minimum payout amount
  if (calculation.netAmount < MIN_PAYOUT_AMOUNT) {
    throw new Error(
      `Payout amount ₹${calculation.netAmount} is below minimum ₹${MIN_PAYOUT_AMOUNT}`,
    );
  }

  // Validate maximum payout amount (anti-fraud)
  if (calculation.netAmount > MAX_PAYOUT_AMOUNT) {
    throw new Error(
      `Payout amount ₹${calculation.netAmount} exceeds maximum ₹${MAX_PAYOUT_AMOUNT}. Manual review required.`,
    );
  }

  // Generate unique payout number
  const payoutNumber = await (Payout as any).generatePayoutNumber();

  // Create payout
  const payout = new Payout({
    vendorId,
    payoutNumber,
    status: PayoutStatus.PENDING,
    statusHistory: [
      {
        status: PayoutStatus.PENDING,
        changedBy: vendorId,
        changedAt: new Date(),
        notes: 'Payout created',
      },
    ],
    lineItems: calculation.lineItems,
    grossAmount: calculation.grossAmount,
    totalCommission: calculation.totalCommission,
    totalRefunds: calculation.totalRefunds,
    netAmount: calculation.netAmount,
    method,
    periodStart: calculation.periodStart,
    periodEnd: calculation.periodEnd,
    isKYCVerified: true,
    requiresManualReview: calculation.netAmount > 500000, // ₹5L+ requires review
  });

  await payout.save();

  return payout;
}

/**
 * Get payout by ID
 */
export async function getPayoutById(payoutId: Types.ObjectId): Promise<IPayout | null> {
  return await Payout.findById(payoutId)
    .populate('vendorId', 'name email storeName')
    .populate('statusHistory.changedBy', 'name email');
}

/**
 * Get all payouts for a vendor
 */
export async function getPayoutsForVendor(
  vendorId: Types.ObjectId,
  filters?: {
    status?: PayoutStatus;
    limit?: number;
    skip?: number;
  },
): Promise<{ payouts: IPayout[]; total: number }> {
  const query: any = { vendorId };

  if (filters?.status) {
    query.status = filters.status;
  }

  const limit = filters?.limit || 20;
  const skip = filters?.skip || 0;

  const [payouts, total] = await Promise.all([
    Payout.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip),
    Payout.countDocuments(query),
  ]);

  return { payouts, total };
}

/**
 * Get all payouts (admin view)
 */
export async function getAllPayouts(filters?: {
  status?: PayoutStatus;
  vendorId?: Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}): Promise<{ payouts: IPayout[]; total: number }> {
  const query: any = {};

  if (filters?.status) {
    query.status = filters.status;
  }

  if (filters?.vendorId) {
    query.vendorId = filters.vendorId;
  }

  if (filters?.startDate || filters?.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = filters.startDate;
    }
    if (filters.endDate) {
      query.createdAt.$lte = filters.endDate;
    }
  }

  const limit = filters?.limit || 50;
  const skip = filters?.skip || 0;

  const [payouts, total] = await Promise.all([
    Payout.find(query)
      .populate('vendorId', 'name email storeName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip),
    Payout.countDocuments(query),
  ]);

  return { payouts, total };
}

/**
 * Get payout summary statistics
 */
export async function getPayoutSummary(vendorId?: Types.ObjectId): Promise<IPayoutSummary> {
  const matchStage: any = vendorId ? { vendorId } : {};

  const [statusCounts, amountAgg] = await Promise.all([
    Payout.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Payout.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$netAmount' },
        },
      },
    ]),
  ]);

  const summary: IPayoutSummary = {
    totalPayouts: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalPendingAmount: 0,
    totalCompletedAmount: 0,
  };

  for (const item of statusCounts) {
    summary.totalPayouts += item.count;

    switch (item._id) {
      case PayoutStatus.PENDING:
        summary.pending = item.count;
        break;
      case PayoutStatus.PROCESSING:
        summary.processing = item.count;
        break;
      case PayoutStatus.COMPLETED:
        summary.completed = item.count;
        break;
      case PayoutStatus.FAILED:
        summary.failed = item.count;
        break;
    }
  }

  for (const item of amountAgg) {
    if (item._id === PayoutStatus.PENDING) {
      summary.totalPendingAmount = item.totalAmount;
    } else if (item._id === PayoutStatus.COMPLETED) {
      summary.totalCompletedAmount = item.totalAmount;
    }
  }

  return summary;
}

/**
 * Process a payout (admin operation)
 *
 * @param payoutId - Payout ObjectId
 * @param adminId - Admin user processing the payout
 * @param transactionId - Bank/UPI transaction ID
 * @returns Updated payout
 */
export async function processPayout(
  payoutId: Types.ObjectId,
  adminId: Types.ObjectId,
  transactionId: string,
): Promise<IPayout> {
  const payout = await Payout.findById(payoutId);

  if (!payout) {
    throw new Error('Payout not found');
  }

  await payout.process(adminId, transactionId);

  return payout;
}

/**
 * Mark payout as completed
 *
 * @param payoutId - Payout ObjectId
 * @param transactionDate - Date payment was completed
 * @returns Updated payout
 */
export async function completePayout(
  payoutId: Types.ObjectId,
  transactionDate: Date,
): Promise<IPayout> {
  const payout = await Payout.findById(payoutId);

  if (!payout) {
    throw new Error('Payout not found');
  }

  await payout.markCompleted(transactionDate);

  return payout;
}

/**
 * Mark payout as failed
 *
 * @param payoutId - Payout ObjectId
 * @param reason - Failure reason
 * @returns Updated payout
 */
export async function failPayout(payoutId: Types.ObjectId, reason: string): Promise<IPayout> {
  const payout = await Payout.findById(payoutId);

  if (!payout) {
    throw new Error('Payout not found');
  }

  await payout.markFailed(reason);

  return payout;
}

/**
 * Get pending payouts count (for admin dashboard)
 */
export async function getPendingPayoutsCount(): Promise<number> {
  return await Payout.countDocuments({
    status: PayoutStatus.PENDING,
  });
}

/**
 * Get payouts requiring manual review
 */
export async function getPayoutsRequiringReview(): Promise<IPayout[]> {
  return await Payout.find({
    requiresManualReview: true,
    status: PayoutStatus.PENDING,
  })
    .populate('vendorId', 'name email storeName')
    .sort({ createdAt: -1 })
    .limit(50);
}

/**
 * Calculate total earnings for vendor (all time)
 */
export async function getVendorTotalEarnings(vendorId: Types.ObjectId): Promise<number> {
  const result = await Payout.aggregate([
    {
      $match: {
        vendorId,
        status: PayoutStatus.COMPLETED,
      },
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$netAmount' },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalEarnings : 0;
}

/**
 * Schedule automatic payouts (cron job helper)
 *
 * Creates payouts for all eligible vendors for the given period.
 * Only creates payouts if net amount >= minimum threshold.
 */
export async function scheduleAutomaticPayouts(
  periodStart: Date,
  periodEnd: Date,
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const results = {
    created: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // TODO: Get all active vendors with KYC verified
  // For now, return empty results

  console.log(
    `[Payout Service] Automatic payout scheduling stub for period ${periodStart} to ${periodEnd}`,
  );

  return results;
}

/**
 * Validate payout can be processed
 */
export function validatePayoutProcessing(payout: IPayout): {
  canProcess: boolean;
  reason?: string;
} {
  if (!payout.isKYCVerified) {
    return { canProcess: false, reason: 'KYC not verified' };
  }

  if (payout.status !== PayoutStatus.PENDING) {
    return { canProcess: false, reason: `Invalid status: ${payout.status}` };
  }

  if (payout.netAmount <= 0) {
    return { canProcess: false, reason: 'Net amount must be positive' };
  }

  return { canProcess: true };
}
