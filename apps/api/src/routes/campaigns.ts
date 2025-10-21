import { Router } from 'express';
import {
	getVendorCampaigns,
	getCampaignById,
	createCampaign,
	updateCampaign,
	pauseCampaign,
	resumeCampaign,
	deleteCampaign,
	getCampaignStats,
	estimateCampaign,
} from '../controllers/campaigns';

const router = Router();

// Public/estimation endpoints
import type { RequestHandler } from 'express';

router.post('/estimate', estimateCampaign as RequestHandler);

// Vendor endpoints (require auth middleware)
// TODO: Add auth middleware: router.use(authMiddleware);
router.get('/', getVendorCampaigns as RequestHandler);
router.post('/', createCampaign as RequestHandler);
router.get('/:id', getCampaignById as RequestHandler);
router.put('/:id', updateCampaign as RequestHandler);
router.post('/:id/pause', pauseCampaign as RequestHandler);
router.post('/:id/resume', resumeCampaign as RequestHandler);
router.delete('/:id', deleteCampaign as RequestHandler);
router.get('/:id/stats', getCampaignStats as RequestHandler);

export default router;
