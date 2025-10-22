import { Router } from 'express';
import {
  getVendorEscalationHistory,
  getMyActions,
  checkOrderAcceptance,
  getVendorsPendingAction,
  adminOverrideAction,
  adminCreateAction,
  getEscalationRules,
} from '../controllers/metrics/escalation';
// Import auth middleware (placeholder - adjust path as needed)
// import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

/**
 * Public/Vendor routes
 */

// Vendor: Get my active actions (warnings/suspensions)
// TODO: Add authenticate middleware
router.get('/my-actions', /* authenticate, */ getMyActions);

// Vendor: Check if I can accept orders
// TODO: Add authenticate middleware
router.get('/can-accept-orders', /* authenticate, */ checkOrderAcceptance);

/**
 * Admin routes
 */

// Admin: Get all vendors requiring action
// TODO: Add authenticate + requireRole('admin') middleware
router.get('/pending', /* authenticate, requireRole('admin'), */ getVendorsPendingAction);

// Admin: Get escalation rules
// TODO: Add authenticate + requireRole('admin') middleware
router.get('/rules', /* authenticate, requireRole('admin'), */ getEscalationRules);

// Admin: Get escalation history for a specific vendor
// TODO: Add authenticate + requireRole('admin') middleware
router.get(
  '/vendor/:vendorId/history',
  /* authenticate, requireRole('admin'), */ getVendorEscalationHistory,
);

// Admin: Override a vendor action
// TODO: Add authenticate + requireRole('admin') middleware
router.post(
  '/action/:actionId/override',
  /* authenticate, requireRole('admin'), */ adminOverrideAction,
);

// Admin: Manually create a vendor action
// TODO: Add authenticate + requireRole('admin') middleware
router.post(
  '/vendor/:vendorId/action',
  /* authenticate, requireRole('admin'), */ adminCreateAction,
);

export default router;
