import { Router, Request, Response } from 'express';
import { recordClick, recordImpression } from '../services/adTracking';

const router = Router();

/**
 * Track ad impression
 */
router.post('/impression', async (req: Request, res: Response) => {
	try {
		const { campaignId, userId, sessionId, placement, keyword } = req.body;

		if (!campaignId || !placement) {
			return res.status(400).json({
				error: 'Missing required fields: campaignId, placement',
			});
		}

		const success = await recordImpression({
			campaignId,
			userId,
			sessionId,
			placement,
			keyword,
		});

		if (success) {
			res.json({ success: true, message: 'Impression recorded' });
		} else {
			res.status(500).json({ success: false, message: 'Failed to record impression' });
		}
	} catch (error) {
		console.error('Error tracking impression:', error);
		res.status(500).json({ success: false, message: 'Internal error' });
	}
});

/**
 * Track ad click
 */
router.post('/click', async (req: Request, res: Response) => {
	try {
		const {
			campaignId,
			userId,
			sessionId,
			placement,
			keyword,
		} = req.body;

		if (!campaignId || !placement) {
			return res.status(400).json({
				error: 'Missing required fields: campaignId, placement',
			});
		}

		// Get client info from request
		const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress;
		const userAgent = req.headers['user-agent'];
		const referer = req.headers['referer'];

		const result = await recordClick({
			campaignId,
			userId,
			sessionId,
			placement,
			keyword,
			ipAddress,
			userAgent,
			referer,
		});

		res.json(result);
	} catch (error) {
		console.error('Error tracking click:', error);
		res.status(500).json({
			success: false,
			message: 'Internal error',
		});
	}
});

export default router;
