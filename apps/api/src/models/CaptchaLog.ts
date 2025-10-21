import { Schema, model } from 'mongoose';

const captchaLogSchema = new Schema({
  ip: String,
  endpoint: String,
  timestamp: { type: Date, default: Date.now },
  success: Boolean,
  score: Number,
  action: String,
  reason: String,
  fingerprint: String,
  headless: Boolean,
});

captchaLogSchema.statics.logAttempt = async function (data: any) {
  await this.create(data);
};

export const CaptchaLog = model('CaptchaLog', captchaLogSchema);
