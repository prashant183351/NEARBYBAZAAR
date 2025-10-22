// Server-side watermark verification utility
// Verifies a digital signature embedded in the watermark of an image
// Uses sharp for image processing

import sharp from 'sharp';
import crypto from 'crypto';

export interface WatermarkVerifyOptions {
  secret: string; // Shared secret for signature
  region?: { x: number; y: number; w: number; h: number }; // Where to look for signature
  expectedText?: string; // Optionally, expected watermark text
}

// Helper: Compute a hash signature for watermark
export function computeWatermarkSignature({
  text,
  secret,
}: {
  text: string;
  secret: string;
}): string {
  return crypto
    .createHash('sha256')
    .update(text + secret)
    .digest('hex')
    .slice(0, 8);
}

// Helper: Extract signature from image (e.g. from bottom-right corner, as text or pixel pattern)
export async function extractSignatureFromImage(
  imageBuffer: Buffer,
  // ...existing code...
): Promise<string | null> {
  // For demo: Assume signature is encoded as visible text in bottom-right 100x30px region
  // ...existing code...
  const { width, height } = await sharp(imageBuffer).metadata();
  if (!width || !height) return null;
  // ...existing code...
  // ...existing code...
  // OCR: In production, use tesseract.js or similar to read text. Here, just return null (stub)
  // TODO: Integrate OCR for real signature extraction
  return null;
}

// Main: Verify watermark signature
export async function verifyWatermark(
  imageBuffer: Buffer,
  options: WatermarkVerifyOptions,
): Promise<boolean> {
  // 1. Extract signature from image
  const extracted = await extractSignatureFromImage(imageBuffer);
  if (!extracted) return false;
  // 2. Compute expected signature
  if (!options.expectedText) return false;
  const expectedSig = computeWatermarkSignature({
    text: options.expectedText,
    secret: options.secret,
  });
  // 3. Compare
  return extracted === expectedSig;
}

// Add watermark overlay utility
export async function addWatermark(buffer: Buffer, text: string): Promise<Buffer> {
  const image = sharp(buffer);
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error('Invalid image');
  // For demo: overlay text at bottom
  return await image
    .composite([
      {
        input: Buffer.from(
          `<svg width="${width}" height="40"><text x="10" y="30" font-size="24" fill="white" opacity="0.7">${text}</text></svg>`,
        ),
        left: 0,
        top: height - 40,
      },
    ])
    .png()
    .toBuffer();
}

// Back-compat: simple stub used by legacy tests
export function addServerWatermark(buffer: Buffer, _text: string): Buffer {
  return buffer;
}
