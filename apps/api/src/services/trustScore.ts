// Seller Trust & Reputation Score
import { Types } from 'mongoose';
import { Order } from '../models/Order';
import Return from '../models/Return';
import { Dispute } from '../models/Dispute';
import { Review } from '../models/Review';

export interface TrustScoreBreakdown {
  orderDefectRate: number;
  lateShipmentRate: number;
  avgReview: number;
  disputeRate: number;
  score: number;
}

export async function calculateTrustScore(vendorId: Types.ObjectId | string): Promise<TrustScoreBreakdown> {
  // Time window: last 90 days
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  // Orders
  const totalOrders = await Order.countDocuments({ vendorId, createdAt: { $gte: since } });
  const lateOrders = await Order.countDocuments({ vendorId, createdAt: { $gte: since }, shippedAt: { $exists: true }, $expr: { $gt: ["$shippedAt", "$expectedShipBy"] } });
  // Returns/Refunds
  const defects = await Return.countDocuments({ vendorId, createdAt: { $gte: since }, status: { $in: ['refunded', 'partially_refunded', 'replaced'] } });
  // Disputes
  const disputes = await Dispute.countDocuments({ vendorId, createdAt: { $gte: since }, status: { $ne: 'resolved' } });
  // Reviews
  const reviews = await Review.find({ vendorId, createdAt: { $gte: since } }, { rating: 1 });
  const avgReview = reviews.length ? reviews.reduce((sum: number, r: { rating?: number }) => sum + (r.rating || 0), 0) / reviews.length : 5;
  // Rates
  const orderDefectRate = totalOrders ? defects / totalOrders : 0;
  const lateShipmentRate = totalOrders ? lateOrders / totalOrders : 0;
  const disputeRate = totalOrders ? disputes / totalOrders : 0;
  // Weighted formula (recent issues count more)
  let score = 100;
  score -= orderDefectRate * 40;
  score -= lateShipmentRate * 20;
  score -= disputeRate * 30;
  score += (avgReview - 4) * 10; // 4+ is good, <4 penalized
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  return { orderDefectRate, lateShipmentRate, avgReview, disputeRate, score: Math.round(score) };
}
