import { Schema, model } from 'mongoose';

// Define the schema for comparison items
const ComparisonItemSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      itemId: { type: Schema.Types.ObjectId, required: true },
      itemType: { type: String, enum: ['product', 'service', 'property'], required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export const ComparisonItem = model('ComparisonItem', ComparisonItemSchema);