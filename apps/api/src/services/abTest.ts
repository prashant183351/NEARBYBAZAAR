import { BuyerActivity } from '../models/BuyerActivity';

// Simple A/B test assignment (random)
export function assignAbTestVariant(userId: string, _testName: string): 'A' | 'B' {
	const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
	return hash % 2 === 0 ? 'A' : 'B';
}

// Log engagement for variant
export async function logAbTestEngagement(userId: string, testName: string, variant: string, event: string) {
	await BuyerActivity.create({ userId, productId: null, type: `abtest_${testName}_${variant}_${event}` });
}
