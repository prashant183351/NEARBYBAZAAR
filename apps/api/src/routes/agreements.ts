import { Router } from 'express';
import { AgreementModel, AgreementAcceptanceModel } from '../models/Agreement';
import { getPendingAgreements, recordAcceptance } from '../services/compliance';
import { Types } from 'mongoose';

const router = Router();

/**
 * GET /api/agreements/pending
 * Get all pending agreements for the current user (vendor/supplier).
 */
router.get('/pending', async (req, res) => {
  try {
    // @ts-ignore - assume auth middleware sets req.user
    const { userId, userType } = req.user; // e.g., { userId: vendorId, userType: 'vendor' }

    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pending = await getPendingAgreements(new Types.ObjectId(userId), userType);
    res.json({ pending });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/agreements/:id/accept
 * Record acceptance of a specific agreement.
 */
router.post('/:id/accept', async (req, res) => {
  try {
    // @ts-ignore
    const { userId, userType } = req.user;

    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const agreementId = new Types.ObjectId(req.params.id);
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    await recordAcceptance(agreementId, new Types.ObjectId(userId), userType, ipAddress, userAgent);

    res.json({ success: true, message: 'Agreement accepted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agreements
 * List all agreements (for admin purposes).
 */
router.get('/', async (_req, res) => {
  try {
    const agreements = await AgreementModel.find().sort({ effectiveDate: -1 });
    res.json({ agreements });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/agreements
 * Create a new agreement version (admin only).
 */
router.post('/', async (req, res) => {
  try {
    const { type, version, title, content, effectiveDate } = req.body;

    const agreement = await AgreementModel.create({
      type,
      version,
      title,
      content,
      effectiveDate: new Date(effectiveDate),
    });

    res.status(201).json({ agreement });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agreements/acceptances
 * Get acceptance records (for audit).
 */
router.get('/acceptances', async (req, res) => {
  try {
    const { acceptorId, acceptorType } = req.query;

    const filter: any = {};
    if (acceptorId) filter.acceptorId = new Types.ObjectId(acceptorId as string);
    if (acceptorType) filter.acceptorType = acceptorType;

    const acceptances = await AgreementAcceptanceModel.find(filter)
      .populate('agreementId')
      .sort({ acceptedAt: -1 });

    res.json({ acceptances });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
