import { Schema, model } from 'mongoose';

const buyerActivitySchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	productId: { type: Schema.Types.ObjectId, ref: 'Product' },
	type: { type: String, enum: ['view', 'add_to_cart', 'purchase', 'wishlist'], required: true },
	timestamp: { type: Date, default: Date.now },
});

export const BuyerActivity = model('BuyerActivity', buyerActivitySchema);
