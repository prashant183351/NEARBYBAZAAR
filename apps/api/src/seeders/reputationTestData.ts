import { Order } from '../models/Order';
import { Vendor } from '../models/Vendor';
import { Types } from 'mongoose';

/**
 * Generate test orders for reputation metrics testing
 * Creates a mix of good and problematic orders for a vendor
 */
export async function generateTestReputationData(vendorId: string, totalOrders: number = 100) {
	const vendor = await Vendor.findById(vendorId);
	if (!vendor) throw new Error('Vendor not found');

	console.log(`Generating ${totalOrders} test orders for vendor ${vendor.name}...`);

	const orders = [];
	const now = new Date();

	for (let i = 0; i < totalOrders; i++) {
		// Create date within last 30 days
		const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
		
		// Determine order characteristics
		const isProblematic = Math.random() < 0.15; // 15% problematic orders
		const isLate = Math.random() < 0.08; // 8% late shipments
		const isCancelled = Math.random() < 0.03; // 3% cancellations

		let status = 'delivered';
		let hasDispute = false;
		let shippedAt = null;
		let expectedDispatchDate = null;
		let cancelledBy = undefined;
		let cancellationReason = undefined;

		if (isCancelled) {
			status = 'cancelled';
			cancelledBy = Math.random() < 0.7 ? 'vendor' : 'buyer';
			cancellationReason = cancelledBy === 'vendor' ? 'out_of_stock' : 'buyer_request';
		} else if (isProblematic) {
			// Some orders have issues
			const issueType = Math.random();
			if (issueType < 0.33) {
				status = 'refunded';
			} else if (issueType < 0.66) {
				status = 'returned';
			} else {
				status = 'delivered';
				hasDispute = true;
			}
		}

		// Set shipping dates for non-cancelled orders
		if (status !== 'cancelled') {
			expectedDispatchDate = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days
			
			if (isLate) {
				// Ship 3-5 days after expected
				shippedAt = new Date(expectedDispatchDate.getTime() + (3 + Math.random() * 2) * 24 * 60 * 60 * 1000);
			} else {
				// Ship on time or early
				shippedAt = new Date(expectedDispatchDate.getTime() - Math.random() * 24 * 60 * 60 * 1000);
			}
		}

		const order = {
			user: new Types.ObjectId(),
			vendor: new Types.ObjectId(vendorId),
			status,
			hasDispute,
			shippedAt,
			expectedDispatchDate,
			cancelledBy,
			cancellationReason,
			items: [
				{
					product: new Types.ObjectId(),
					quantity: Math.floor(Math.random() * 5) + 1,
					price: Math.floor(Math.random() * 1000) + 100,
					total: 0,
				},
			],
			subtotal: 0,
			tax: 0,
			total: 0,
			currency: 'INR',
			createdAt,
			updatedAt: createdAt,
		};

		// Calculate totals
		order.items[0].total = order.items[0].price * order.items[0].quantity;
		order.subtotal = order.items[0].total;
		order.tax = Math.round(order.subtotal * 0.18); // 18% GST
		order.total = order.subtotal + order.tax;

		orders.push(order);
	}

	// Bulk insert
	await Order.insertMany(orders);

	console.log(`✅ Generated ${totalOrders} test orders`);
	console.log(`   - ${orders.filter(o => o.status === 'refunded' || o.status === 'returned' || o.hasDispute).length} defective orders`);
	console.log(`   - ${orders.filter(o => o.shippedAt && o.expectedDispatchDate && o.shippedAt > o.expectedDispatchDate).length} late shipments`);
	console.log(`   - ${orders.filter(o => o.status === 'cancelled' && (o.cancelledBy === 'vendor' || o.cancellationReason === 'out_of_stock')).length} vendor cancellations`);

	return orders;
}

/**
 * Clean up test reputation data
 */
export async function cleanupTestReputationData(vendorId: string) {
	const result = await Order.deleteMany({ vendor: vendorId });
	console.log(`🗑️  Deleted ${result.deletedCount} test orders for vendor ${vendorId}`);
	return result;
}

/**
 * Generate test data for multiple vendors with varying performance levels
 */
export async function generateMultiVendorTestData() {
	const vendors = await Vendor.find({ status: 'active' }).limit(10);
	
	if (vendors.length === 0) {
		console.log('⚠️  No active vendors found. Please create vendors first.');
		return;
	}

	console.log(`Generating test data for ${vendors.length} vendors...`);

	for (let i = 0; i < vendors.length; i++) {
		const vendor = vendors[i];
		const orderCount = 50 + Math.floor(Math.random() * 150); // 50-200 orders
		
		await generateTestReputationData((vendor as any)._id.toString(), orderCount);
	}

	console.log('✅ Multi-vendor test data generation complete!');
}

// CLI usage example
if (require.main === module) {
	const mongoose = require('mongoose');
	
	mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nearbybazaar')
		.then(async () => {
			console.log('Connected to MongoDB');
			
			// Usage example:
			// const vendorId = 'YOUR_VENDOR_ID_HERE';
			// await generateTestReputationData(vendorId, 100);
			// OR
			// await generateMultiVendorTestData();
			
			console.log('✅ Done! (Uncomment usage code above to run)');
			await mongoose.disconnect();
		})
		.catch(console.error);
}

export default {
	generateTestReputationData,
	cleanupTestReputationData,
	generateMultiVendorTestData,
};
