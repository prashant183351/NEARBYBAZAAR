import { Schema, model, Types } from 'mongoose';

const abTestLogSchema = new Schema({
	vendor: { type: Types.ObjectId, ref: 'Vendor' },
	testName: { type: String, required: true },
	variant: { type: String, required: true },
	ctr: { type: Number, default: 0 },
	sales: { type: Number, default: 0 },
	createdAt: { type: Date, default: Date.now },
});

export const ABTestLog = model('ABTestLog', abTestLogSchema);
