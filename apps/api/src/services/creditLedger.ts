import { BuyerCredit, PaymentTermTemplate, PaymentTermType } from '../models/CreditTerm';
import { Order } from '../models/Order';
import { Types } from 'mongoose';

/**
 * Service for managing buyer credit and payment terms
 */

/**
 * Apply for credit as a buyer
 */
export async function applyForCredit(
  userId: string,
  requestedAmount: number,
  notes?: string
): Promise<any> {
  // Check if already exists
  let buyerCredit = await BuyerCredit.findOne({ userId });
  
  if (buyerCredit) {
    if (buyerCredit.status === 'approved') {
      throw new Error('Credit already approved. Request increase instead.');
    }
    if (buyerCredit.status === 'pending') {
      throw new Error('Credit application already pending review.');
    }
  }
  
  // Create new application
  buyerCredit = new BuyerCredit({
    userId: new Types.ObjectId(userId),
    creditLimit: requestedAmount,
    availableCredit: 0, // Not available until approved
    outstandingAmount: 0,
    totalCreditUsed: 0,
    status: 'pending',
    notes
  });
  
  await buyerCredit.save();
  return buyerCredit;
}

/**
 * Admin approves credit for buyer
 */
export async function approveCredit(
  userId: string,
  approvedBy: string,
  creditLimit: number,
  paymentTermId?: string,
  maxNetDays?: number,
  riskLevel?: 'low' | 'medium' | 'high'
): Promise<any> {
  const buyerCredit = await BuyerCredit.findOne({ userId });
  
  if (!buyerCredit) {
    throw new Error('No credit application found for this user.');
  }
  
  if (buyerCredit.status === 'approved') {
    throw new Error('Credit already approved. Use updateCreditLimit instead.');
  }
  
  buyerCredit.creditLimit = creditLimit;
  buyerCredit.availableCredit = creditLimit; // Full credit available
  buyerCredit.status = 'approved';
  buyerCredit.approvedBy = approvedBy.toString();
  buyerCredit.approvedAt = new Date();
  buyerCredit.lastReviewDate = new Date();
  
  if (paymentTermId) {
    buyerCredit.defaultPaymentTermId = paymentTermId.toString();
  }
  
  if (maxNetDays) {
    buyerCredit.maxNetDays = maxNetDays;
  }
  
  if (riskLevel) {
    buyerCredit.riskLevel = riskLevel;
  }
  
  await buyerCredit.save();
  return buyerCredit;
}

/**
 * Admin rejects credit application
 */
export async function rejectCredit(
  userId: string,
  reason: string
): Promise<any> {
  const buyerCredit = await BuyerCredit.findOne({ userId });
  
  if (!buyerCredit) {
    throw new Error('No credit application found.');
  }
  
  buyerCredit.status = 'rejected';
  buyerCredit.notes = reason;
  buyerCredit.lastReviewDate = new Date();
  
  await buyerCredit.save();
  return buyerCredit;
}

/**
 * Update credit limit for existing buyer
 */
export async function updateCreditLimit(
  userId: string,
  newLimit: number,
  updatedBy: string
): Promise<any> {
  const buyerCredit = await BuyerCredit.findOne({ userId });
  
  if (!buyerCredit || buyerCredit.status !== 'approved') {
    throw new Error('Buyer does not have approved credit.');
  }
  
  const difference = newLimit - buyerCredit.creditLimit;
  
  buyerCredit.creditLimit = newLimit;
  buyerCredit.availableCredit = Math.max(0, buyerCredit.availableCredit + difference);
  buyerCredit.approvedBy = updatedBy.toString();
  buyerCredit.lastReviewDate = new Date();
  
  await buyerCredit.save();
  return buyerCredit;
}

/**
 * Suspend credit (e.g., for late payments)
 */
export async function suspendCredit(
  userId: string,
  reason: string
): Promise<any> {
  const buyerCredit = await BuyerCredit.findOne({ userId });
  
  if (!buyerCredit) {
    throw new Error('Buyer credit not found.');
  }
  
  buyerCredit.status = 'suspended';
  buyerCredit.notes = reason;
  buyerCredit.lastReviewDate = new Date();
  
  await buyerCredit.save();
  return buyerCredit;
}

/**
 * Check if buyer can use credit for order
 */
export async function checkCreditAvailability(
  userId: string,
  orderAmount: number
): Promise<{ available: boolean; reason?: string; credit?: any }> {
  const buyerCredit = await BuyerCredit.findOne({ userId });
  
  if (!buyerCredit) {
    return { available: false, reason: 'No credit account found' };
  }
  
  if (buyerCredit.status !== 'approved') {
    return { available: false, reason: `Credit status: ${buyerCredit.status}`, credit: buyerCredit };
  }
  
  if (buyerCredit.availableCredit < orderAmount) {
    return { 
      available: false, 
      reason: `Insufficient credit. Available: ₹${buyerCredit.availableCredit}, Required: ₹${orderAmount}`,
      credit: buyerCredit
    };
  }
  
  return { available: true, credit: buyerCredit };
}

/**
 * Allocate credit when order is placed with credit terms
 */
export async function allocateOrderCredit(
  userId: string,
  orderId: string,
  amount: number
): Promise<boolean> {
  const buyerCredit = await BuyerCredit.findOne({ userId });
  
  if (!buyerCredit) {
    throw new Error('Buyer credit not found.');
  }
  
  const allocated = await buyerCredit.allocateCredit(amount);
  
  if (!allocated) {
    throw new Error('Failed to allocate credit. Insufficient available credit.');
  }
  
  // Update order
  await Order.findByIdAndUpdate(orderId, {
    creditUsed: amount,
    outstandingAmount: amount
  });
  
  return true;
}

/**
 * Release credit when order is cancelled
 */
export async function releaseOrderCredit(
  userId: string,
  orderId: string
): Promise<void> {
  const order = await Order.findById(orderId);
  
  if (!order || !order.creditUsed || order.creditUsed === 0) {
    return; // No credit was used
  }
  
  const buyerCredit = await BuyerCredit.findOne({ userId });
  
  if (!buyerCredit) {
    throw new Error('Buyer credit not found.');
  }
  
  await buyerCredit.releaseCredit(order.creditUsed);
  
  // Update order
  await Order.findByIdAndUpdate(orderId, {
    creditUsed: 0,
    outstandingAmount: 0
  });
}

/**
 * Record payment against order
 */
export async function recordOrderPayment(
  userId: string,
  orderId: string,
  paymentAmount: number
): Promise<any> {
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error('Order not found.');
  }
  
  const buyerCredit = await BuyerCredit.findOne({ userId });
  
  if (!buyerCredit) {
    throw new Error('Buyer credit not found.');
  }
  
  // Calculate how much of this payment goes toward outstanding credit
  const creditPayment = Math.min(order.outstandingAmount, paymentAmount);
  
  if (creditPayment > 0) {
    await buyerCredit.recordPayment(creditPayment);
  }
  
  // Update order
  const newPaidAmount = (order.paidAmount || 0) + paymentAmount;
  const newOutstanding = Math.max(0, order.outstandingAmount - creditPayment);
  
  let paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overdue' = 'unpaid';
  if (newPaidAmount >= order.total) {
    paymentStatus = 'paid';
  } else if (newPaidAmount > 0) {
    paymentStatus = 'partial';
  }
  
  // Check if overdue
  if (order.paymentTerms?.dueDate && new Date() > order.paymentTerms.dueDate && paymentStatus !== 'paid') {
    paymentStatus = 'overdue';
  }
  
  await Order.findByIdAndUpdate(orderId, {
    paidAmount: newPaidAmount,
    outstandingAmount: newOutstanding,
    paymentStatus
  });
  
  return {
    order,
    credit: buyerCredit,
    paymentAmount,
    creditPayment,
    newOutstanding
  };
}

/**
 * Get buyer credit summary
 */
export async function getBuyerCreditSummary(userId: string): Promise<any> {
  const buyerCredit = await BuyerCredit.findOne({ userId })
    .populate('defaultPaymentTermId')
    .populate('approvedBy', 'name email');
  
  if (!buyerCredit) {
    return null;
  }
  
  // Get orders with outstanding amounts
  const outstandingOrders = await Order.find({
    user: userId,
    outstandingAmount: { $gt: 0 }
  }).select('_id total paidAmount outstandingAmount paymentTerms paymentStatus createdAt');
  
  // Count overdue orders
  const overdueOrders = await Order.countDocuments({
    user: userId,
    paymentStatus: 'overdue'
  });
  
  return {
    credit: buyerCredit,
    outstandingOrders,
    overdueCount: overdueOrders,
    utilizationPercentage: buyerCredit.utilizationPercentage
  };
}

/**
 * Calculate payment schedule for order with terms
 */
export function calculatePaymentSchedule(
  orderTotal: number,
  paymentTerm: any
): { advance: number; onDelivery: number; dueDate?: Date } {
  if (!paymentTerm) {
    return { advance: orderTotal, onDelivery: 0 };
  }
  
  switch (paymentTerm.type) {
    case PaymentTermType.FULL_ADVANCE:
      return { advance: orderTotal, onDelivery: 0 };
      
    case PaymentTermType.PARTIAL_ADVANCE: {
      const advancePercent = paymentTerm.advancePercentage || 30;
      const advance = Math.round(orderTotal * (advancePercent / 100));
      return { 
        advance, 
        onDelivery: orderTotal - advance 
      };
    }
    
    case PaymentTermType.NET_DAYS: {
      const netDays = paymentTerm.netDays || 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + netDays);
      return { 
        advance: 0, 
        onDelivery: 0,
        dueDate
      };
    }
    
    case PaymentTermType.COD:
      return { advance: 0, onDelivery: orderTotal };
      
    default:
      return { advance: orderTotal, onDelivery: 0 };
  }
}

/**
 * List all payment term templates
 */
export async function listPaymentTermTemplates(activeOnly = true): Promise<any[]> {
  const query = activeOnly ? { isActive: true } : {};
  return PaymentTermTemplate.find(query).sort({ name: 1 });
}

/**
 * Create payment term template (admin)
 */
export async function createPaymentTermTemplate(data: any): Promise<any> {
  const template = new PaymentTermTemplate(data);
  await template.save();
  return template;
}

/**
 * Mark overdue orders
 */
export async function markOverdueOrders(): Promise<number> {
  const now = new Date();
  
  const result = await Order.updateMany(
    {
      paymentStatus: { $in: ['unpaid', 'partial'] },
      'paymentTerms.dueDate': { $lt: now }
    },
    {
      $set: { paymentStatus: 'overdue' }
    }
  );
  
  return result.modifiedCount || 0;
}
