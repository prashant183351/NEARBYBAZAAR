import { Schema, model, Types } from 'mongoose';

const recommendationLogSchema = new Schema({
	product: { type: Types.ObjectId, ref: 'Product', required: true },
	user: { type: Types.ObjectId, ref: 'User' },
	action: { type: String, enum: ['view', 'click', 'purchase'], required: true },
	timestamp: { type: Date, default: Date.now },
	context: { type: String }, // e.g. 'personalized', 'boughtTogether', etc.
});

export const RecommendationLog = model('RecommendationLog', recommendationLogSchema);
