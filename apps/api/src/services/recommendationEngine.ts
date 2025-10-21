import { BuyerActivity } from '../models/BuyerActivity';
import { Product } from '../models/Product';
import { Order } from '../models/Order';

// Simple collaborative filtering stub
export async function getRecommendations(userId: string, limit = 10) {
	// Get products interacted by user
	const userActivities = await BuyerActivity.find({ userId });
	const userProductIds = userActivities.map(a => String(a.productId));
	// Find other users who interacted with same products
	const otherActivities = await BuyerActivity.find({ productId: { $in: userProductIds }, userId: { $ne: userId } });
	const otherUserIds = [...new Set(otherActivities.map(a => String(a.userId)))];
	// Get products those users interacted with, excluding already seen
	const candidateActivities = await BuyerActivity.find({ userId: { $in: otherUserIds }, productId: { $nin: userProductIds } });
	const candidateProductIds = [...new Set(candidateActivities.map(a => String(a.productId)))];
	// Get product details
	const products = await Product.find({ _id: { $in: candidateProductIds } }).limit(limit);
	return products;
}

export async function getFrequentlyBoughtTogether(productId: string, limit = 5) {
	// Find orders containing this product
	const orders = await Order.find({ 'items.productId': productId });
	const coProductCounts: Record<string, number> = {};
	orders.forEach(order => {
		order.items.forEach(item => {
				const pid = String(item.product);
			if (pid !== productId) coProductCounts[pid] = (coProductCounts[pid] || 0) + 1;
		});
	});
	const sorted = Object.entries(coProductCounts).sort((a, b) => b[1] - a[1]).slice(0, limit);
	const coProductIds = sorted.map(([pid]) => pid);
	return await Product.find({ _id: { $in: coProductIds } });
}

export async function getCustomersAlsoViewed(productId: string, limit = 5) {
	// Find users who viewed this product
	const activities = await BuyerActivity.find({ productId, type: 'view' });
	const userIds = [...new Set(activities.map(a => String(a.userId)))];
	// Find other products these users viewed
	const otherActivities = await BuyerActivity.find({ userId: { $in: userIds }, type: 'view', productId: { $ne: productId } });
	const viewCounts: Record<string, number> = {};
	otherActivities.forEach(a => {
		const pid = String(a.productId);
		viewCounts[pid] = (viewCounts[pid] || 0) + 1;
	});
	const sorted = Object.entries(viewCounts).sort((a, b) => b[1] - a[1]).slice(0, limit);
	const alsoViewedIds = sorted.map(([pid]) => pid);
	return await Product.find({ _id: { $in: alsoViewedIds } });
}

// Multi-lingual support for recommendation categories
export const recommendationLabels = {
	boughtTogether: {
		en: 'Frequently Bought Together',
		hi: 'अक्सर साथ में खरीदा गया',
	},
	alsoViewed: {
		en: 'Customers Also Viewed',
		hi: 'ग्राहकों ने यह भी देखा',
	},
};
