import { Schema, model, Document, Types } from 'mongoose';

export type RFQMessageAuthor = 'buyer' | 'vendor' | 'admin';

export interface RFQMessageType extends Document {
  quote: Types.ObjectId;
  authorType: RFQMessageAuthor;
  author?: Types.ObjectId;
  message: string;
  createdAt: Date;
}

const RFQMessageSchema = new Schema<RFQMessageType>({
  quote: { type: Schema.Types.ObjectId, ref: 'RFQQuote', required: true, index: true },
  authorType: { type: String, enum: ['buyer', 'vendor', 'admin'], required: true },
  author: { type: Schema.Types.ObjectId, refPath: 'authorType' },
  message: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const RFQMessage = model<RFQMessageType>('RFQMessage', RFQMessageSchema);