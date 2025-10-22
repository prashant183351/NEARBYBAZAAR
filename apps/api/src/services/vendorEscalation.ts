import { VendorAction, IVendorAction } from '../models/VendorAction';
import { Vendor } from '../models/Vendor';
import { ReputationMetrics } from './reputationMetrics';
import { logger } from '@nearbybazaar/lib';
import { Types } from 'mongoose';

export interface EscalationRule {
  metric: 'odr' | 'lateShipment' | 'cancellation';
  warningThreshold: number;
  tempSuspendThreshold: number;
  permanentBlockThreshold: number;
  consecutiveViolations?: number; // How many periods in violation before escalation
}

// Configurable escalation rules
const ESCALATION_RULES: EscalationRule[] = [
  {
    metric: 'odr',
    warningThreshold: 1,
    tempSuspendThreshold: 2,
    permanentBlockThreshold: 4,
    consecutiveViolations: 2,
  },
  {
    metric: 'lateShipment',
    warningThreshold: 5,
    tempSuspendThreshold: 10,
    permanentBlockThreshold: 15,
    consecutiveViolations: 2,
  },
  {
    metric: 'cancellation',
    warningThreshold: 3,
    tempSuspendThreshold: 6,
    permanentBlockThreshold: 10,
    consecutiveViolations: 2,
  },
];

export type ActionType = 'warning' | 'temp_suspend' | 'permanent_block';

interface EscalationDecision {
  shouldAct: boolean;
  actionType?: ActionType;
  reason: string;
  violations: string[];
}

/**
 * Evaluate vendor metrics against escalation rules
 */
export function evaluateEscalation(metrics: ReputationMetrics): EscalationDecision {
  const violations: string[] = [];
  let highestAction: ActionType | null = null;

  // Check each metric against rules
  ESCALATION_RULES.forEach((rule) => {
    let metricValue = 0;
    let metricName = '';

    switch (rule.metric) {
      case 'odr':
        metricValue = metrics.orderDefectRate;
        metricName = 'Order Defect Rate';
        break;
      case 'lateShipment':
        metricValue = metrics.lateShipmentRate;
        metricName = 'Late Shipment Rate';
        break;
      case 'cancellation':
        metricValue = metrics.cancellationRate;
        metricName = 'Cancellation Rate';
        break;
    }

    // Check if threshold exceeded
    if (metricValue >= rule.permanentBlockThreshold) {
      violations.push(
        `${metricName}: ${metricValue}% (threshold: ${rule.permanentBlockThreshold}%)`,
      );
      highestAction = 'permanent_block';
    } else if (metricValue >= rule.tempSuspendThreshold) {
      violations.push(`${metricName}: ${metricValue}% (threshold: ${rule.tempSuspendThreshold}%)`);
      if (!highestAction || highestAction === 'warning') {
        highestAction = 'temp_suspend';
      }
    } else if (metricValue >= rule.warningThreshold) {
      violations.push(`${metricName}: ${metricValue}% (threshold: ${rule.warningThreshold}%)`);
      if (!highestAction) {
        highestAction = 'warning';
      }
    }
  });

  return {
    shouldAct: violations.length > 0,
    actionType: highestAction || undefined,
    reason: violations.join('; '),
    violations,
  };
}

/**
 * Create a vendor action record
 */
export async function createVendorAction(
  vendorId: string,
  actionType: ActionType,
  reason: string,
  metrics: ReputationMetrics,
  triggeredBy: 'system' | 'admin' = 'system',
  triggeredByUser?: string,
): Promise<IVendorAction> {
  // Check if there's already an active action of this type
  const existingAction = await VendorAction.findOne({
    vendor: vendorId,
    actionType,
    status: 'active',
  });

  if (existingAction) {
    logger.info(`Vendor ${vendorId} already has active ${actionType} action`);
    return existingAction;
  }

  // Set expiration for temporary suspensions (30 days)
  const expiresAt =
    actionType === 'temp_suspend' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined;

  const action = await VendorAction.create({
    vendor: new Types.ObjectId(vendorId),
    actionType,
    reason,
    triggeredBy,
    triggeredByUser: triggeredByUser ? new Types.ObjectId(triggeredByUser) : undefined,
    metrics: {
      orderDefectRate: metrics.orderDefectRate,
      lateShipmentRate: metrics.lateShipmentRate,
      cancellationRate: metrics.cancellationRate,
    },
    status: 'active',
    expiresAt,
  });

  // Update vendor status
  await updateVendorStatus(vendorId, actionType);

  logger.info(`Created ${actionType} action for vendor ${vendorId}`);

  return action;
}

/**
 * Update vendor status based on action type
 */
async function updateVendorStatus(vendorId: string, actionType: ActionType): Promise<void> {
  const statusMap = {
    warning: 'active', // Stay active but flagged
    temp_suspend: 'suspended',
    permanent_block: 'blocked',
  };

  await Vendor.findByIdAndUpdate(vendorId, {
    status: statusMap[actionType],
    suspendedAt: actionType !== 'warning' ? new Date() : undefined,
  });
}

/**
 * Override a vendor action (admin only)
 */
export async function overrideVendorAction(
  actionId: string,
  adminId: string,
  overrideReason: string,
): Promise<IVendorAction> {
  const action = await VendorAction.findById(actionId);

  if (!action) {
    throw new Error('Action not found');
  }

  if (action.status !== 'active' && action.status !== 'pending') {
    throw new Error('Can only override active or pending actions');
  }

  // Update action status
  action.status = 'overridden';
  action.overrideReason = overrideReason;
  action.overrideBy = new Types.ObjectId(adminId);
  action.overrideAt = new Date();

  await action.save();

  // Restore vendor status if it was suspended/blocked
  if (action.actionType === 'temp_suspend' || action.actionType === 'permanent_block') {
    await Vendor.findByIdAndUpdate(action.vendor, {
      status: 'active',
      suspendedAt: undefined,
    });
  }

  logger.info(`Admin ${adminId} overrode ${action.actionType} for vendor ${action.vendor}`);

  return action;
}

/**
 * Get active actions for a vendor
 */
export async function getVendorActions(
  vendorId: string,
  includeExpired: boolean = false,
): Promise<IVendorAction[]> {
  const query: any = { vendor: vendorId };

  if (!includeExpired) {
    query.status = { $in: ['active', 'pending'] };
  }

  return VendorAction.find(query).sort({ createdAt: -1 });
}

/**
 * Check if vendor can accept new orders
 */
export async function canVendorAcceptOrders(vendorId: string): Promise<{
  allowed: boolean;
  reason?: string;
  actionType?: ActionType;
}> {
  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    return { allowed: false, reason: 'Vendor not found' };
  }

  if (vendor.status === 'blocked') {
    return {
      allowed: false,
      reason: 'Account permanently blocked due to performance issues',
      actionType: 'permanent_block',
    };
  }

  if (vendor.status === 'suspended') {
    const activeAction = await VendorAction.findOne({
      vendor: vendorId,
      status: 'active',
      actionType: { $in: ['temp_suspend', 'permanent_block'] },
    });

    if (activeAction) {
      return {
        allowed: false,
        reason: `Account suspended: ${activeAction.reason}`,
        actionType: activeAction.actionType,
      };
    }
  }

  return { allowed: true };
}

/**
 * Expire temporary suspensions that have passed their expiration date
 */
export async function expireSuspensions(): Promise<number> {
  const now = new Date();

  const expiredActions = await VendorAction.find({
    status: 'active',
    actionType: 'temp_suspend',
    expiresAt: { $lte: now },
  });

  let count = 0;

  for (const action of expiredActions) {
    action.status = 'expired';
    await action.save();

    // Restore vendor to active status
    await Vendor.findByIdAndUpdate(action.vendor, {
      status: 'active',
      suspendedAt: undefined,
    });

    logger.info(`Expired temp suspension for vendor ${action.vendor}`);
    count++;
  }

  return count;
}

/**
 * Get escalation history for a vendor
 */
export async function getEscalationHistory(vendorId: string): Promise<{
  totalActions: number;
  warnings: number;
  suspensions: number;
  blocks: number;
  activeActions: IVendorAction[];
  recentActions: IVendorAction[];
}> {
  const allActions = await VendorAction.find({ vendor: vendorId }).sort({ createdAt: -1 });
  const activeActions = allActions.filter((a) => a.status === 'active');

  return {
    totalActions: allActions.length,
    warnings: allActions.filter((a) => a.actionType === 'warning').length,
    suspensions: allActions.filter((a) => a.actionType === 'temp_suspend').length,
    blocks: allActions.filter((a) => a.actionType === 'permanent_block').length,
    activeActions,
    recentActions: allActions.slice(0, 10),
  };
}

/**
 * Get all vendors requiring action (for admin dashboard)
 */
export async function getVendorsRequiringAction(): Promise<
  Array<{
    vendor: any;
    action: IVendorAction;
    metrics: ReputationMetrics;
  }>
> {
  const pendingActions = await VendorAction.find({
    status: 'pending',
  }).populate('vendor');

  // This would ideally include current metrics, but keeping it simple for now
  return pendingActions.map((action) => ({
    vendor: action.vendor,
    action,
    metrics: action.metrics as any,
  }));
}

export { ESCALATION_RULES };
