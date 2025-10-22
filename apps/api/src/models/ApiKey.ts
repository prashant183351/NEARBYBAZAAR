import { Schema, model } from 'mongoose';

const apiKeySchema = new Schema({
  key: { type: String, required: true, unique: true },
  appId: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  scopes: [String],
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  rotatedAt: { type: Date },
  active: { type: Boolean, default: true },
});

export const ApiKey = model('ApiKey', apiKeySchema);
