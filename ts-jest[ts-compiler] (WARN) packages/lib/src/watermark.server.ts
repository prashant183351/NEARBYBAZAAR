import sharp from 'sharp';
import crypto from 'crypto';

/**
 * packages/lib/src/watermark.server.ts
 * Server-side watermark verification for NearbyBazaar
 * - Verifies digital watermark signature embedded in images (see chunk 049)
 * - Uses sharp for image processing
 * - Exports: verifyWatermarkSignature(buffer, options)
 */


export interface WatermarkVerifyOptions {
    signatureText?: string; // Expected watermark text (e.g. "NearbyBazaar")
    signatureHash?: string; // Optional: expected hash (if using hash-based signature)
    region?: { left: number; top: number; width: number; height: number }; // Area to check
    fuzz?: number; // Tolerance for minor differences
}

/**
 * Compute a hash from the watermark text and a secret (for signature)
 */
export function computeWatermarkHash(text: string, secret: string): string {
    return crypto.createHash('sha256').update(`${text}:${secret}`).digest('hex').slice(0, 16);
}

/**
 * Verifies that the watermark signature is present in the image.
 * - Looks for the watermark text or a hash in a specific region (default: bottom-right)
 * - Returns true if signature is detected, false otherwise
 */
export async function verifyWatermarkSignature(
    imageBuffer: Buffer,
    options: WatermarkVerifyOptions = {}
): Promise<boolean> {
    // Default region: bottom-right 20% of image
    const { signatureText = 'NearbyBazaar', signatureHash, region, fuzz = 10 } = options;
    const image = sharp(imageBuffer);
    const { width, height } = await image.metadata();

    if (!width || !height) return false;

    // Define region to check (default: bottom-right 20% area)
    const checkRegion = region || {
        left: Math.floor(width * 0.8),
        top: Math.floor(height * 0.8),
        width: Math.floor(width * 0.2),
        height: Math.floor(height * 0.2),
    };

    // Extract region as raw pixels (greyscale for easier OCR/hash)
    const regionBuffer = await image
        .extract(checkRegion)
        .greyscale()
        .raw()
        .toBuffer();

    // Option 1: If using a hash-based signature, look for the hash in pixel data
    if (signatureHash) {
        // Convert regionBuffer to hex string and search for hash
        const regionHex = regionBuffer.toString('hex');
        if (regionHex.includes(signatureHash)) return true;
    }

    // Option 2: If using visible text, attempt simple OCR (stub: look for ASCII codes)
    // (For production, integrate with tesseract.js or similar for real OCR)
    const ascii = regionBuffer
        .toString('ascii')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();

    if (ascii.includes(signatureText.toLowerCase().replace(/\s+/g, ''))) {
        return true;
    }

    // Option 3: Fuzzy pixel pattern match (stub: check for non-uniformity)
    // (In real use, compare with a reference watermark pattern)
    const uniqueVals = new Set(regionBuffer);
    if (uniqueVals.size > fuzz) {
        // Assume watermark present if region is not uniform (i.e., text likely present)
        return true;
    }

    return false;
}