import { Request, Response } from 'express';
import {
  getVendorActions,
  overrideVendorAction,
  getEscalationHistory,
  getVendorsRequiringAction,
  canVendorAcceptOrders,
  createVendorAction,
  ESCALATION_RULES,
} from '../../services/vendorEscalation';
import { getVendorReputationMetrics } from '../../services/reputationMetrics';

// TODO: Move to @types/express or auth middleware types
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'vendor' | 'user' | 'admin';
    scopes?: string[];
  };
}

/**
 * Get escalation history for a vendor
 */
export const getVendorEscalationHistory = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;

    if (!vendorId) {
      return res.status(400).json({ success: false, error: 'Vendor ID required' });
    }

    const history = await getEscalationHistory(vendorId);

    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get active actions for a vendor (vendor can see their own)
 */
export const getMyActions = async (req: AuthRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;

    if (!vendorId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const actions = await getVendorActions(vendorId, false);

    res.json({ success: true, data: actions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Check if vendor can accept new orders
 */
export const checkOrderAcceptance = async (req: AuthRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;

    if (!vendorId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await canVendorAcceptOrders(vendorId);

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Get all vendors requiring action
 */
export const getVendorsPendingAction = async (_req: Request, res: Response) => {
  try {
    const vendors = await getVendorsRequiringAction();

    res.json({ success: true, data: vendors });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Override a vendor action
 */
export const adminOverrideAction = async (req: AuthRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    const { overrideReason } = req.body;
    const adminId = req.user?.id;

    if (!actionId) {
      return res.status(400).json({ success: false, error: 'Action ID required' });
    }

    if (!overrideReason || overrideReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Override reason required (minimum 10 characters)',
      });
    }

    if (!adminId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const action = await overrideVendorAction(actionId, adminId, overrideReason);

    res.json({
      success: true,
      data: action,
      message: 'Action overridden successfully. Vendor has been restored to active status.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Manually create a vendor action
 */
export const adminCreateAction = async (req: AuthRequest, res: Response) => {
  try {
    const { vendorId } = req.params;
    const { actionType, reason } = req.body;
    const adminId = req.user?.id;

    if (!vendorId || !actionType || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID, action type, and reason required',
      });
    }

    if (!['warning', 'temp_suspend', 'permanent_block'].includes(actionType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action type',
      });
    }

    if (!adminId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get current metrics
    const metrics = await getVendorReputationMetrics(vendorId, 30);

    const action = await createVendorAction(
      vendorId,
      actionType,
      reason,
      metrics,
      'admin',
      adminId,
    );

    res.json({
      success: true,
      data: action,
      message: `${actionType} created successfully for vendor`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get escalation rules (for display in UI)
 */
export const getEscalationRules = async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        rules: ESCALATION_RULES,
        description: 'Thresholds for automatic vendor actions based on performance metrics',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
