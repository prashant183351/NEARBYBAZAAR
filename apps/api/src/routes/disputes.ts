/**
 * Disputes Routes
 */
import { Router } from 'express';
import { createDispute, getDispute, addMessage, escalateDispute, resolveDispute, listDisputes } from '../controllers/disputes';
import { authorize } from '../middleware/auth';
import { Dispute } from '../models/Dispute';

const router = Router();

// Create dispute: owner is buyerId in body
router.post(
	'/',
	authorize({
		action: 'create',
		resource: 'dispute',
		getContext: (req) => ({ ownerId: (req as any).user?.id ?? req.body?.buyerId ?? null }),
	}),
	createDispute
);

// List disputes: allow admin manage; vendors see their disputes; buyers see theirs
router.get(
	'/',
	authorize({
		action: 'read',
		resource: 'dispute',
		requireAuth: true,
		getContext: (req) => {
			const user = (req as any).user;
			const vendorId = (req.query?.vendorId as string) || null;
			const buyerId = (req.query?.buyerId as string) || null;
			// Map ownership: for vendor role compare vendorId, for user compare buyerId
			if (user?.role === 'vendor') return { resourceOwnerId: vendorId };
			if (user?.role === 'user') return { resourceOwnerId: buyerId };
			return {};
		},
	}),
	listDisputes
);

// Get a single dispute: resolve ownership from DB depending on role
router.get(
	'/:id',
	authorize({
		action: 'read',
		resource: 'dispute',
		requireAuth: true,
		getContext: async (req) => {
			const user = (req as any).user;
			const d = await Dispute.findById(req.params.id).select('buyerId vendorId').lean();
			if (!d) return {};
			if (user?.role === 'vendor') return { resourceOwnerId: String(d.vendorId) };
			if (user?.role === 'user') return { resourceOwnerId: String(d.buyerId) };
			return {};
		},
	}),
	getDispute
);

// Add message: treat as update
router.post(
	'/:id/messages',
	authorize({
		action: 'update',
		resource: 'dispute',
		requireAuth: true,
		getContext: async (req) => {
			const user = (req as any).user;
			const d = await Dispute.findById(req.params.id).select('buyerId vendorId').lean();
			if (!d) return {};
			if (user?.role === 'vendor') return { resourceOwnerId: String(d.vendorId) };
			if (user?.role === 'user') return { resourceOwnerId: String(d.buyerId) };
			return {};
		},
	}),
	addMessage
);

// Escalate: vendor or admin can escalate; buyers can request escalate via update too
router.post(
	'/:id/escalate',
	authorize({
		action: 'update',
		resource: 'dispute',
		requireAuth: true,
		getContext: async (req) => {
			const user = (req as any).user;
			const d = await Dispute.findById(req.params.id).select('buyerId vendorId').lean();
			if (!d) return {};
			if (user?.role === 'vendor') return { resourceOwnerId: String(d.vendorId) };
			if (user?.role === 'user') return { resourceOwnerId: String(d.buyerId) };
			return {};
		},
	}),
	escalateDispute
);

// Resolve: admin only (authorize middleware will pass for admin via can())
router.post(
	'/:id/resolve',
	authorize({ action: 'manage', resource: 'admin', requireAuth: true }),
	resolveDispute
);

export default router;
