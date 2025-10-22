import crypto from 'crypto';
import { addWatermark } from '../../../../packages/lib/src/watermark.server';
import { performOCR } from '../../../../packages/lib/src/ocr';

const SERVER_SECRET = process.env.KYC_DOC_SECRET || 'default_secret';

export function encryptKycDoc(buffer: Buffer, vendorId: string) {
  const iv = crypto.randomBytes(16);
  const key = crypto
    .createHash('sha256')
    .update(SERVER_SECRET + vendorId)
    .digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { encrypted, iv: iv.toString('hex'), tag: tag.toString('hex') };
}

export async function watermarkKycDoc(buffer: Buffer, vendorId: string) {
  const date = new Date().toISOString().slice(0, 10);
  const text = `For NearbyBazaar use only - VendorID: ${vendorId} - ${date}`;
  return await addWatermark(buffer, text);
}

export async function verifyKycDocOCR(buffer: Buffer, expected: { pan?: string; gst?: string }) {
  const ocrData = await performOCR(buffer);
  let ocrVerified = true;
  if (expected.pan && ocrData.pan !== expected.pan) ocrVerified = false;
  if (expected.gst && ocrData.gst !== expected.gst) ocrVerified = false;
  return { ocrVerified, ocrData };
}
