import { computeWatermarkSignature, verifyWatermark } from '../src/watermark.server';
import fs from 'fs';
import path from 'path';

describe('Watermark Signature', () => {
  it('computes deterministic signature', () => {
    const sig1 = computeWatermarkSignature({ text: 'Test', secret: 'abc123' });
    const sig2 = computeWatermarkSignature({ text: 'Test', secret: 'abc123' });
    expect(sig1).toBe(sig2);
    expect(sig1).toHaveLength(8);
  });
});

describe('Watermark Verification', () => {
  it('rejects image without signature (stub)', async () => {
    const imgPath = path.join(__dirname, 'fixtures', 'plain.jpg');
    if (!fs.existsSync(imgPath)) return;
    const buffer = fs.readFileSync(imgPath);
    const ok = await verifyWatermark(buffer, { secret: 'abc123', expectedText: 'Test' });
    expect(ok).toBe(false);
  });
  // Add more tests with real OCR integration as needed
});
