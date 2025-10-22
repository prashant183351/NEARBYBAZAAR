/**
 * Disputes Controller
 */
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Dispute, DisputeStatus, DisputeCategory } from '../models/Dispute';
import { emailQueue } from '../queues';
import { scheduleSLAJob } from '../queues/disputes';

// Helpers
function userIdFromReq(req: Request): Types.ObjectId | null {
  const id = (req as any).user?._id;
  try {
    return id ? new Types.ObjectId(id) : null;
  } catch {
    return null;
  }
}

function roleFromReq(req: Request): 'buyer' | 'vendor' | 'admin' {
  const role = (req as any).user?.role || req.query.role || 'buyer'; // role from query for tests
  if (role === 'vendor' || role === 'admin') return role;
  return 'buyer';
}

// Notifications (basic email via queue)
async function notify(to: string, subject: string, text: string) {
  await emailQueue.add('send', { to, subject, text });
}

export const createDispute = async (req: Request, res: Response) => {
  try {
    const { orderId, vendorId, buyerId, category, subject, description, message } = req.body;

    if (!orderId || !vendorId || !buyerId || !category || !subject) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (!Object.values(DisputeCategory).includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }

    const dispute = await Dispute.create({
      orderId: new Types.ObjectId(orderId),
      vendorId: new Types.ObjectId(vendorId),
      buyerId: new Types.ObjectId(buyerId),
      category,
      subject,
      description,
      messages: message ? [{ senderRole: 'buyer', senderId: userIdFromReq(req), message }] : [],
    });

    // Schedule SLA escalation via delayed email reminder (placeholder)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    await notify(adminEmail, 'New Dispute Opened', `Dispute ${dispute._id} opened: ${subject}`);
    // Queue SLA auto-escalation
    await scheduleSLAJob(String(dispute._id), dispute.slaRespondBy);

    return res.status(201).json({ success: true, dispute });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getDispute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dispute = await Dispute.findById(id);
    if (!dispute) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, dispute });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const addMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'Message required' });

    const dispute = await Dispute.findById(id);
    if (!dispute) return res.status(404).json({ success: false, error: 'Not found' });

    const role = roleFromReq(req);
    const uid = userIdFromReq(req);

    await dispute.addMessage(role, uid, message);

    // Notify other party (basic placeholder)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    await notify(adminEmail, `New message in dispute ${dispute._id}`, message);

    return res.json({ success: true, dispute });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const escalateDispute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const dispute = await Dispute.findById(id);
    if (!dispute) return res.status(404).json({ success: false, error: 'Not found' });

    await dispute.escalate(reason);

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    await notify(adminEmail, `Dispute escalated ${dispute._id}`, reason || 'No reason provided');

    return res.json({ success: true, dispute });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const resolveDispute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolutionNote, adminId } = req.body;

    if (!resolutionNote)
      return res.status(400).json({ success: false, error: 'resolutionNote required' });

    const dispute = await Dispute.findById(id);
    if (!dispute) return res.status(404).json({ success: false, error: 'Not found' });

    const admin = adminId
      ? new Types.ObjectId(adminId)
      : userIdFromReq(req) || new Types.ObjectId();
    await dispute.resolve(admin, resolutionNote);

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    await notify(adminEmail, `Dispute resolved ${dispute._id}`, resolutionNote);

    return res.json({ success: true, dispute });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const listDisputes = async (req: Request, res: Response) => {
  try {
    const { status, vendorId, buyerId, limit = 20, skip = 0 } = req.query as any;
    const q: any = {};
    if (status && Object.values(DisputeStatus).includes(status)) q.status = status;
    if (vendorId) q.vendorId = new Types.ObjectId(vendorId);
    if (buyerId) q.buyerId = new Types.ObjectId(buyerId);

    const [items, total] = await Promise.all([
      Dispute.find(q).sort({ createdAt: -1 }).limit(Number(limit)).skip(Number(skip)),
      Dispute.countDocuments(q),
    ]);

    return res.json({ success: true, items, total });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
