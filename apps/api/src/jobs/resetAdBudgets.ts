/**
 * Daily job to reset ad campaign budgets and handle expired campaigns
 * Should run once per day at midnight
 */

import { AdCampaign } from '../models/AdCampaign';

export async function resetAdBudgets() {
	console.log('[resetAdBudgets] Starting daily ad budget reset...');

	try {
		const now = new Date();

		// 1. Reset daily spend for all campaigns
		const resetResult = await AdCampaign.updateMany(
			{},
			{
				$set: {
					spentToday: 0,
				},
			}
		);

		console.log(`[resetAdBudgets] Reset daily spend for ${resetResult.modifiedCount} campaigns`);

		// 2. Mark campaigns as expired if end date passed
		const expireResult = await AdCampaign.updateMany(
			{
				status: { $in: ['active', 'paused'] },
				endDate: { $lte: now },
			},
			{
				$set: {
					status: 'expired',
				},
			}
		);

		console.log(`[resetAdBudgets] Marked ${expireResult.modifiedCount} campaigns as expired`);

		// 3. Pause campaigns that exhausted their total budget
		const campaigns = await AdCampaign.find({
			status: 'active',
			$expr: { $gte: ['$spentTotal', '$totalBudget'] },
		});

		let pausedCount = 0;
		for (const campaign of campaigns) {
			campaign.status = 'paused';
			await campaign.save();
			pausedCount++;
		}

		console.log(`[resetAdBudgets] Paused ${pausedCount} budget-exhausted campaigns`);

		// 4. Mark campaigns as completed if they reached end date and spent their budget
		const completeResult = await AdCampaign.updateMany(
			{
				status: { $in: ['active', 'paused'] },
				endDate: { $lte: now },
				$expr: { $gte: ['$spentTotal', '$totalBudget'] },
			},
			{
				$set: {
					status: 'completed',
				},
			}
		);

		console.log(`[resetAdBudgets] Marked ${completeResult.modifiedCount} campaigns as completed`);

		console.log('[resetAdBudgets] Daily ad budget reset completed successfully');

		return {
			success: true,
			resetCount: resetResult.modifiedCount,
			expiredCount: expireResult.modifiedCount,
			pausedCount,
			completedCount: completeResult.modifiedCount,
		};
	} catch (error) {
		console.error('[resetAdBudgets] Error during daily reset:', error);
		throw error;
	}
}

/**
 * Manually trigger budget reset (for testing or admin use)
 */
export async function triggerManualReset() {
	console.log('[triggerManualReset] Manually triggering budget reset...');
	return resetAdBudgets();
}
