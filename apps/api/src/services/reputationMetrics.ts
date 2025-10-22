import { Order } from '../models/Order';
import { Vendor } from '../models/Vendor';

export interface ReputationMetrics {
  orderDefectRate: number;
  lateShipmentRate: number;
  cancellationRate: number;
  totalOrders: number;
  period: string;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
}

export interface ReputationThresholds {
  odr: { excellent: number; good: number; warning: number; critical: number };
  lateShipment: { excellent: number; good: number; warning: number; critical: number };
  cancellation: { excellent: number; good: number; warning: number; critical: number };
}

// Define marketplace thresholds (can be made configurable)
const THRESHOLDS: ReputationThresholds = {
  odr: { excellent: 0.5, good: 1, warning: 2, critical: 3 }, // percentages
  lateShipment: { excellent: 2, good: 4, warning: 7, critical: 10 },
  cancellation: { excellent: 1, good: 2.5, warning: 5, critical: 7.5 },
};

/**
 * Calculate Order Defect Rate (ODR)
 * ODR = (refunds + returns + disputes) / total orders * 100
 */
async function calculateODR(vendorId: string, startDate: Date, endDate: Date): Promise<number> {
  const totalOrders = await Order.countDocuments({
    vendor: vendorId,
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $nin: ['cancelled'] }, // exclude cancelled from denominator
  });

  if (totalOrders === 0) return 0;

  const defectiveOrders = await Order.countDocuments({
    vendor: vendorId,
    createdAt: { $gte: startDate, $lte: endDate },
    $or: [{ status: 'refunded' }, { status: 'returned' }, { hasDispute: true }],
  });

  return Math.round((defectiveOrders / totalOrders) * 10000) / 100; // 2 decimal places
}

/**
 * Calculate Late Shipment Rate
 * Late = shipped after expected dispatch date
 */
async function calculateLateShipmentRate(
  vendorId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const shippedOrders = await Order.find({
    vendor: vendorId,
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $in: ['shipped', 'delivered'] },
  }).select('shippedAt expectedDispatchDate');

  if (shippedOrders.length === 0) return 0;

  const lateOrders = shippedOrders.filter((order: any) => {
    if (!order.shippedAt || !order.expectedDispatchDate) return false;
    return new Date(order.shippedAt) > new Date(order.expectedDispatchDate);
  }).length;

  return Math.round((lateOrders / shippedOrders.length) * 10000) / 100;
}

/**
 * Calculate Cancellation Rate
 * Vendor-initiated or out-of-stock cancellations
 */
async function calculateCancellationRate(
  vendorId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const totalOrders = await Order.countDocuments({
    vendor: vendorId,
    createdAt: { $gte: startDate, $lte: endDate },
  });

  if (totalOrders === 0) return 0;

  const cancelledOrders = await Order.countDocuments({
    vendor: vendorId,
    createdAt: { $gte: startDate, $lte: endDate },
    status: 'cancelled',
    $or: [{ cancelledBy: 'vendor' }, { cancellationReason: 'out_of_stock' }],
  });

  return Math.round((cancelledOrders / totalOrders) * 10000) / 100;
}

/**
 * Determine overall status based on metrics
 */
function determineStatus(
  metrics: Pick<ReputationMetrics, 'orderDefectRate' | 'lateShipmentRate' | 'cancellationRate'>,
): ReputationMetrics['status'] {
  const { odr, lateShipment, cancellation } = THRESHOLDS;

  // Critical if any metric exceeds critical threshold
  if (
    metrics.orderDefectRate >= odr.critical ||
    metrics.lateShipmentRate >= lateShipment.critical ||
    metrics.cancellationRate >= cancellation.critical
  ) {
    return 'critical';
  }

  // Needs improvement if any metric exceeds warning threshold
  if (
    metrics.orderDefectRate >= odr.warning ||
    metrics.lateShipmentRate >= lateShipment.warning ||
    metrics.cancellationRate >= cancellation.warning
  ) {
    return 'needs_improvement';
  }

  // Good if all metrics are below warning but at least one is above excellent
  if (
    metrics.orderDefectRate > odr.excellent ||
    metrics.lateShipmentRate > lateShipment.excellent ||
    metrics.cancellationRate > cancellation.excellent
  ) {
    return 'good';
  }

  return 'excellent';
}

/**
 * Get reputation metrics for a vendor for a specific period
 */
export async function getVendorReputationMetrics(
  vendorId: string,
  days: number = 30,
): Promise<ReputationMetrics> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [odr, lateShipment, cancellation, totalOrders] = await Promise.all([
    calculateODR(vendorId, startDate, endDate),
    calculateLateShipmentRate(vendorId, startDate, endDate),
    calculateCancellationRate(vendorId, startDate, endDate),
    Order.countDocuments({
      vendor: vendorId,
      createdAt: { $gte: startDate, $lte: endDate },
    }),
  ]);

  const metrics = {
    orderDefectRate: odr,
    lateShipmentRate: lateShipment,
    cancellationRate: cancellation,
    totalOrders,
    period: `${days} days`,
    status: 'good' as ReputationMetrics['status'],
  };

  metrics.status = determineStatus(metrics);

  return metrics;
}

/**
 * Get aggregated reputation metrics for all vendors (admin view)
 */
export async function getAllVendorsReputationMetrics(days: number = 30) {
  const vendors = await Vendor.find({ status: 'active' }).select('_id name email');

  const metricsPromises = vendors.map(async (vendor: any) => {
    const metrics = await getVendorReputationMetrics(vendor._id.toString(), days);
    return {
      vendorId: vendor._id,
      vendorName: vendor.name,
      vendorEmail: vendor.email,
      ...metrics,
    };
  });

  const allMetrics = await Promise.all(metricsPromises);

  // Sort by status severity and then by ODR
  const statusOrder = { critical: 0, needs_improvement: 1, good: 2, excellent: 3 };
  allMetrics.sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return b.orderDefectRate - a.orderDefectRate; // higher ODR first
  });

  return {
    vendors: allMetrics,
    summary: {
      total: allMetrics.length,
      critical: allMetrics.filter((v) => v.status === 'critical').length,
      needsImprovement: allMetrics.filter((v) => v.status === 'needs_improvement').length,
      good: allMetrics.filter((v) => v.status === 'good').length,
      excellent: allMetrics.filter((v) => v.status === 'excellent').length,
    },
    thresholds: THRESHOLDS,
  };
}

/**
 * Check if vendor should be warned or suspended based on metrics
 */
export async function evaluateVendorStanding(vendorId: string): Promise<{
  action: 'none' | 'warning' | 'suspend';
  reason?: string;
  metrics: ReputationMetrics;
}> {
  const metrics = await getVendorReputationMetrics(vendorId, 30);

  // Suspend if critical
  if (metrics.status === 'critical') {
    const reasons = [];
    if (metrics.orderDefectRate >= THRESHOLDS.odr.critical) {
      reasons.push(`ODR ${metrics.orderDefectRate}% exceeds ${THRESHOLDS.odr.critical}%`);
    }
    if (metrics.lateShipmentRate >= THRESHOLDS.lateShipment.critical) {
      reasons.push(
        `Late shipment ${metrics.lateShipmentRate}% exceeds ${THRESHOLDS.lateShipment.critical}%`,
      );
    }
    if (metrics.cancellationRate >= THRESHOLDS.cancellation.critical) {
      reasons.push(
        `Cancellation ${metrics.cancellationRate}% exceeds ${THRESHOLDS.cancellation.critical}%`,
      );
    }
    return {
      action: 'suspend',
      reason: reasons.join('; '),
      metrics,
    };
  }

  // Warn if needs improvement
  if (metrics.status === 'needs_improvement') {
    const reasons = [];
    if (metrics.orderDefectRate >= THRESHOLDS.odr.warning) {
      reasons.push(`ODR ${metrics.orderDefectRate}% exceeds ${THRESHOLDS.odr.warning}%`);
    }
    if (metrics.lateShipmentRate >= THRESHOLDS.lateShipment.warning) {
      reasons.push(
        `Late shipment ${metrics.lateShipmentRate}% exceeds ${THRESHOLDS.lateShipment.warning}%`,
      );
    }
    if (metrics.cancellationRate >= THRESHOLDS.cancellation.warning) {
      reasons.push(
        `Cancellation ${metrics.cancellationRate}% exceeds ${THRESHOLDS.cancellation.warning}%`,
      );
    }
    return {
      action: 'warning',
      reason: reasons.join('; '),
      metrics,
    };
  }

  return { action: 'none', metrics };
}

export { THRESHOLDS };
