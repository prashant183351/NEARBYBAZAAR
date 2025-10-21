import { Product } from '../models/Product';
import { RecommendationLog } from '../models/RecommendationLog';
import { ABTestLog } from '../models/ABTestLog';

export async function getVendorRecommendationMetrics(vendorId: string) {
	const products = await Product.find({ vendor: vendorId });
	const logs = await RecommendationLog.find({ product: { $in: products.map(p => p._id) } });
	const abTests = await ABTestLog.find({ vendor: vendorId });
	return {
		products: products.map((p: any) => {
			const recs = logs.filter((l: any) => l.product.equals(p._id));
			const recommended = recs.length;
			const clicks = recs.filter((l: any) => l.action === 'click').length;
			const sales = recs.filter((l: any) => l.action === 'purchase').length;
			const ctr = recommended ? Math.round((clicks / recommended) * 100) : 0;
			return { id: p._id, name: p.name, recommended, ctr, sales };
		}),
		abTests: abTests.map((t: any) => ({ test: t.testName, variant: t.variant, ctr: t.ctr, sales: t.sales }))
	};
}

export async function getAdminRecommendationMetrics() {
	const logs = await RecommendationLog.find({});
	const abTests = await ABTestLog.find({});
	const totalRecommended = logs.length;
	const totalClicks = logs.filter((l: any) => l.action === 'click').length;
	const totalSales = logs.filter((l: any) => l.action === 'purchase').length;
	const ctr = totalRecommended ? Math.round((totalClicks / totalRecommended) * 100) : 0;
	return {
		metrics: [
			{ name: 'Total Recommended', value: totalRecommended },
			{ name: 'Total Clicks', value: totalClicks },
			{ name: 'Total Sales', value: totalSales },
			{ name: 'Overall CTR', value: ctr + '%' }
		],
		abTests: abTests.map((t: any) => ({ test: t.testName, variant: t.variant, ctr: t.ctr, sales: t.sales }))
	};
}
