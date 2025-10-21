import { User } from '../models/User';
import { Order } from '../models/Order';
import { Dispute } from '../models/Dispute';
import { Refund } from '../models/Refund';

export async function calculateBuyerRiskScore(buyerId: string) {
	const chargebacks = await Refund.countDocuments({ buyer: buyerId, reason: 'chargeback' });
	const failedPayments = await Order.countDocuments({ buyer: buyerId, status: 'payment_failed' });
	const disputes = await Dispute.countDocuments({ buyer: buyerId, status: 'open' });
	// Simple weighted sum
	return chargebacks * 50 + failedPayments * 20 + disputes * 10;
}

export async function updateBuyerRiskScore(buyerId: string) {
	const score = await calculateBuyerRiskScore(buyerId);
	await User.updateOne({ _id: buyerId }, { riskScore: score });
	return score;
}

export async function isHighRiskBuyer(buyerId: string, threshold = 100) {
	const user = await User.findById(buyerId).select('riskScore').lean();
	return (user && (user as any).riskScore >= threshold);
}
