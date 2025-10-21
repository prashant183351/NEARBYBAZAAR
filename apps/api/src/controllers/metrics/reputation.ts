import { Request, Response } from 'express';
import { getVendorReputationMetrics, getAllVendorsReputationMetrics, evaluateVendorStanding } from '../../services/reputationMetrics';

/**
 * Get reputation metrics for the authenticated vendor
 */
export const getVendorReputation = async (req: Request, res: Response) => {
	try {
		const vendorId = req.user?.id;
		if (!vendorId) {
			return res.status(401).json({ success: false, error: 'Unauthorized' });
		}
		
		const days = parseInt(req.query.days as string) || 30;
		const metrics = await getVendorReputationMetrics(vendorId, days);
		
		res.json({ success: true, data: metrics });
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};

/**
 * Get reputation metrics for all vendors (admin only)
 */
export const getAllVendorsReputation = async (req: Request, res: Response) => {
	try {
		const days = parseInt(req.query.days as string) || 30;
		const data = await getAllVendorsReputationMetrics(days);
		
		res.json({ success: true, data });
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};

/**
 * Evaluate vendor standing and get suggested action (admin only)
 */
export const evaluateVendor = async (req: Request, res: Response) => {
	try {
		const { vendorId } = req.params;
		if (!vendorId) {
			return res.status(400).json({ success: false, error: 'Vendor ID required' });
		}
		
		const evaluation = await evaluateVendorStanding(vendorId);
		
		res.json({ success: true, data: evaluation });
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};
