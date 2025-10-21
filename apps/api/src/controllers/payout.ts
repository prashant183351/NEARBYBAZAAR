import { shouldHoldPayout, isUpiBlacklisted, isIfscBlacklisted } from '../services/fraudDetection';
import { Payout } from '../models/Payout';
import { Request, Response } from 'express';

// Payout request endpoint
export async function requestPayout(req: Request, res: Response) {
	const { vendorId, amount, upi, ifsc } = req.body;
	if (await isUpiBlacklisted(upi)) {
		return res.status(403).json({ error: 'UPI ID is blacklisted for fraud.' });
	}
	if (await isIfscBlacklisted(ifsc)) {
		return res.status(403).json({ error: 'IFSC code is blacklisted for fraud.' });
	}
	if (await shouldHoldPayout(vendorId, amount)) {
		// Mark payout as held for admin review
		await Payout.create({ vendor: vendorId, amount, status: 'held', reason: 'Suspicious payout detected' });
		return res.status(202).json({ status: 'held', message: 'Payout held for admin review due to anomaly.' });
	}
	// Proceed with normal payout
	await Payout.create({ vendor: vendorId, amount, status: 'pending' });
	res.json({ status: 'pending' });
}
