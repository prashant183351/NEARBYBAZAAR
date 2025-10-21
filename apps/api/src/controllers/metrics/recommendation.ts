import { Request, Response } from 'express';
import { getVendorRecommendationMetrics, getAdminRecommendationMetrics } from '../../services/recommendationMetrics';

export const vendorRecommendationMetrics = async (req: Request, res: Response) => {
	const vendorId = req.user?.id;
	if (!vendorId) {
		return res.status(400).json({ error: 'Missing vendorId in user context' });
	}
	const data = await getVendorRecommendationMetrics(vendorId);
	res.json(data);
};

export const adminRecommendationMetrics = async (_req: Request, res: Response) => {
	const data = await getAdminRecommendationMetrics();
	res.json(data);
};
