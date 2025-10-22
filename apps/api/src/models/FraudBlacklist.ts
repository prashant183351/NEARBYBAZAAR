import { Schema, model } from 'mongoose';

const fraudBlacklistSchema = new Schema({
  upis: [String],
  ifsccodes: [String],
  updated: { type: Date, default: Date.now },
});

export const FraudBlacklist = model('FraudBlacklist', fraudBlacklistSchema);
