import { Router, Request, Response } from 'express';
import {
  applyForCredit,
  approveCredit,
  rejectCredit,
  updateCreditLimit,
  suspendCredit,
  checkCreditAvailability,
  getBuyerCreditSummary,
  listPaymentTermTemplates,
  createPaymentTermTemplate,
  markOverdueOrders,
  recordOrderPayment,
} from '../services/creditLedger';
import { BuyerCredit, PaymentTermTemplate } from '../models/CreditTerm';

const router = Router();

/**
 * Buyer applies for credit
 * POST /v1/credit/apply
 */
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { userId, requestedAmount, notes } = req.body;

    if (!userId || !requestedAmount) {
      return res.status(400).json({
        success: false,
        error: 'userId and requestedAmount are required',
      });
    }

    const application = await applyForCredit(userId, requestedAmount, notes);

    res.json({
      success: true,
      data: application,
      message: 'Credit application submitted. Pending admin approval.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get buyer's credit summary
 * GET /v1/credit/summary/:userId
 */
router.get('/summary/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const summary = await getBuyerCreditSummary(userId);

    if (!summary) {
      return res.status(404).json({
        success: false,
        error: 'No credit account found for this user',
      });
    }

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Check credit availability for order
 * POST /v1/credit/check
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { userId, orderAmount } = req.body;

    if (!userId || !orderAmount) {
      return res.status(400).json({
        success: false,
        error: 'userId and orderAmount are required',
      });
    }

    const result = await checkCreditAvailability(userId, orderAmount);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Record payment for order
 * POST /v1/credit/payment
 */
router.post('/payment', async (req: Request, res: Response) => {
  try {
    const { userId, orderId, paymentAmount } = req.body;

    if (!userId || !orderId || !paymentAmount) {
      return res.status(400).json({
        success: false,
        error: 'userId, orderId, and paymentAmount are required',
      });
    }

    const result = await recordOrderPayment(userId, orderId, paymentAmount);

    res.json({
      success: true,
      data: result,
      message: 'Payment recorded successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ============ ADMIN ROUTES ============

/**
 * List all credit applications (admin)
 * GET /v1/credit/admin/applications
 */
router.get('/admin/applications', async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const applications = await BuyerCredit.find(query)
      .populate('userId', 'name email businessProfile')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await BuyerCredit.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Approve credit application (admin)
 * POST /v1/credit/admin/approve
 */
router.post('/admin/approve', async (req: Request, res: Response) => {
  try {
    const { userId, approvedBy, creditLimit, paymentTermId, maxNetDays, riskLevel } = req.body;

    if (!userId || !approvedBy || !creditLimit) {
      return res.status(400).json({
        success: false,
        error: 'userId, approvedBy, and creditLimit are required',
      });
    }

    const approved = await approveCredit(
      userId,
      approvedBy,
      creditLimit,
      paymentTermId,
      maxNetDays,
      riskLevel,
    );

    res.json({
      success: true,
      data: approved,
      message: 'Credit approved successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Reject credit application (admin)
 * POST /v1/credit/admin/reject
 */
router.post('/admin/reject', async (req: Request, res: Response) => {
  try {
    const { userId, reason } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'userId and reason are required',
      });
    }

    const rejected = await rejectCredit(userId, reason);

    res.json({
      success: true,
      data: rejected,
      message: 'Credit application rejected',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update credit limit (admin)
 * PUT /v1/credit/admin/limit
 */
router.put('/admin/limit', async (req: Request, res: Response) => {
  try {
    const { userId, newLimit, updatedBy } = req.body;

    if (!userId || !newLimit || !updatedBy) {
      return res.status(400).json({
        success: false,
        error: 'userId, newLimit, and updatedBy are required',
      });
    }

    const updated = await updateCreditLimit(userId, newLimit, updatedBy);

    res.json({
      success: true,
      data: updated,
      message: 'Credit limit updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Suspend buyer credit (admin)
 * POST /v1/credit/admin/suspend
 */
router.post('/admin/suspend', async (req: Request, res: Response) => {
  try {
    const { userId, reason } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'userId and reason are required',
      });
    }

    const suspended = await suspendCredit(userId, reason);

    res.json({
      success: true,
      data: suspended,
      message: 'Credit suspended',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Mark overdue orders (admin cron)
 * POST /v1/credit/admin/mark-overdue
 */
router.post('/admin/mark-overdue', async (_req: Request, res: Response) => {
  try {
    const count = await markOverdueOrders();

    res.json({
      success: true,
      data: { markedOverdue: count },
      message: `Marked ${count} orders as overdue`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============ PAYMENT TERM TEMPLATES ============

/**
 * List payment term templates
 * GET /v1/credit/terms
 */
router.get('/terms', async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const templates = await listPaymentTermTemplates(activeOnly);

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Create payment term template (admin)
 * POST /v1/credit/admin/terms
 */
router.post('/admin/terms', async (req: Request, res: Response) => {
  try {
    const template = await createPaymentTermTemplate(req.body);

    res.json({
      success: true,
      data: template,
      message: 'Payment term template created',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get payment term template by ID
 * GET /v1/credit/terms/:id
 */
router.get('/terms/:id', async (req: Request, res: Response) => {
  try {
    const template = await PaymentTermTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Payment term template not found',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
