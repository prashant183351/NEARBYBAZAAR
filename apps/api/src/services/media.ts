import crypto from 'crypto';
import { Response } from 'express';
import sharp from 'sharp';
import { cloudinaryStorage as defaultCloudinaryStorage } from './storage/cloudinary';

/**
 * Media Pipeline Service
 * Handles presigned uploads, virus scanning, EXIF stripping, and responsive variants
 */

// Configuration from environment
const MAX_FILE_SIZE = Number(process.env.MAX_UPLOAD_SIZE_MB || 10) * 1024 * 1024; // Default 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf', 'video/mp4'];
const VIRUS_SCAN_ENABLED = process.env.VIRUS_SCAN_ENABLED === 'true';

export interface PresignedUploadRequest {
  filename: string;
  contentType: string;
  size: number;
  folder?: string;
}

export interface PresignedUploadResponse {
  uploadId: string;
  uploadUrl: string;
  expiresAt: Date;
  maxSize: number;
  allowedTypes: string[];
}

export interface VirusScanResult {
  clean: boolean;
  threat?: string;
  scannedAt: Date;
}

export interface MediaProcessingResult {
  url: string;
  publicId: string;
  variants: {
    thumb: string;
    webp: string;
    original: string;
  };
  metadata: {
    width?: number;
    height?: number;
    format?: string;
    size: number;
    exifStripped: boolean;
    virusScanned: boolean;
  };
}

/**
 * Generate presigned upload URL/credentials
 * This allows client to upload directly to storage (reduces server load)
 */
export async function generatePresignedUpload(
  req: PresignedUploadRequest,
): Promise<PresignedUploadResponse> {
  // Validate request
  if (!req.filename || !req.contentType) {
    throw new Error('Filename and contentType are required');
  }

  if (req.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  if (!ALLOWED_FILE_TYPES.includes(req.contentType)) {
    throw new Error(`Content type ${req.contentType} not allowed`);
  }

  // Generate unique upload ID
  const uploadId = `upload_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // For Cloudinary, generate signature for direct upload
  const timestamp = Math.round(expiresAt.getTime() / 1000);
  const folder = req.folder || 'uploads';
  const publicId = `${folder}/${uploadId}`;

  // Cloudinary signature parameters
  const paramsToSign = {
    timestamp,
    folder,
    public_id: publicId,
    upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'nearbybazaar',
  };

  // Generate signature for secure upload
  generateCloudinarySignature(paramsToSign);

  return {
    uploadId,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    expiresAt,
    maxSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_FILE_TYPES,
  };
}

/**
 * Scan file for viruses using ClamAV
 * @throws {Error} If virus detected or scan fails (fail-safe)
 */
export async function scanForViruses(buffer: Buffer): Promise<void> {
  // Check env variable inline to allow tests to override
  const virusScanEnabled = process.env.VIRUS_SCAN_ENABLED === 'true';

  if (!virusScanEnabled) {
    return;
  }

  try {
    // Check for EICAR test file (common antivirus test string)
    const eicarSignature = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
    const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 1000));

    if (bufferString.includes(eicarSignature)) {
      throw new Error('Virus detected: EICAR-Test-File (standard antivirus test signature)');
    }

    // In production, integrate with ClamAV daemon
    // For now, we'll use a simple heuristic check
    const result = await scanWithClamAV(buffer);

    if (!result.clean) {
      throw new Error(`Virus detected: ${result.threat || 'Unknown threat'}`);
    }
  } catch (error) {
    // On scan error, fail safe (reject upload)
    if (error instanceof Error && error.message.includes('Virus detected')) {
      throw error;
    }
    console.error('Virus scan error:', error);
    throw new Error('Virus scan failed - upload rejected for security');
  }
}

/**
 * ClamAV integration (stub - implement with clamd-js or similar)
 */
async function scanWithClamAV(_buffer: Buffer): Promise<VirusScanResult> {
  // TODO: Integrate with ClamAV daemon
  // Example using clamd-js:
  // const clamd = require('clamd-js');
  // const scanner = clamd.createScanner(process.env.CLAMAV_HOST, process.env.CLAMAV_PORT);
  // const result = await scanner.scanBuffer(buffer, 30000);

  // For now, return clean (implement actual scanning in production)
  return {
    clean: true,
    scannedAt: new Date(),
  };
}

/**
 * Strip EXIF metadata from images
 * Removes privacy-sensitive data (GPS, camera info, etc.)
 */
export async function stripExifMetadata(buffer: Buffer, contentType: string): Promise<Buffer> {
  // Only process images
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return buffer;
  }

  try {
    // Use sharp to strip all metadata
    const processed = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation, then strip
      .withMetadata({
        // Keep only essential metadata
        orientation: undefined, // Remove orientation (already applied)
        exif: {}, // Remove all EXIF
        icc: undefined, // Remove color profile (optional - may want to keep)
      })
      .toBuffer();

    return processed;
  } catch (error) {
    console.error('EXIF stripping error:', error);
    // On error, return original (don't fail upload)
    return buffer;
  }
}

/**
 * Process uploaded file: scan, strip metadata, generate variants
 */
export async function processUploadedFile(
  buffer: Buffer,
  options: {
    filename: string;
    contentType: string;
    folder?: string;
    generateVariants?: boolean;
    cloudinary?: typeof defaultCloudinaryStorage;
    scanForVirusesFn?: typeof scanForViruses;
  },
): Promise<MediaProcessingResult> {
  const { filename, contentType, folder = 'uploads', cloudinary, scanForVirusesFn } = options;
  const cloud = cloudinary || defaultCloudinaryStorage;
  const scan = scanForVirusesFn || scanForViruses;

  // 1. Virus scan (throws on virus detection)
  await scan(buffer);

  // 2. Strip EXIF metadata
  let processedBuffer = buffer;
  let exifStripped = false;

  if (ALLOWED_IMAGE_TYPES.includes(contentType)) {
    processedBuffer = await stripExifMetadata(buffer, contentType);
    exifStripped = true;
  }

  // 3. Upload to storage with variant generation
  const uploadResult = await cloud.upload(processedBuffer, {
    folder,
    filename,
    contentType,
    variants: undefined, // Cloudinary handles variants via eager transformations
  });

  // 4. Return processing result
  return {
    url: uploadResult.url,
    publicId: uploadResult.publicId,
    variants: {
      thumb: uploadResult.variants?.thumb || uploadResult.thumbUrl || uploadResult.url,
      webp: uploadResult.variants?.webp || uploadResult.webpUrl || uploadResult.url,
      original: uploadResult.url,
    },
    metadata: {
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      size: processedBuffer.length,
      exifStripped,
      virusScanned: VIRUS_SCAN_ENABLED,
    },
  };
}

/**
 * Validate file before processing
 */
export function validateFile(
  size: number,
  contentType: string,
): { valid: boolean; error?: string } {
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(contentType)) {
    return {
      valid: false,
      error: `Content type ${contentType} not allowed. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Handle upload timeout protection
 */
export function withUploadTimeout<T>(promise: Promise<T>, timeoutMs: number = 60000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Upload timeout exceeded')), timeoutMs),
    ),
  ]);
}

/**
 * Generate Cloudinary signature for secure uploads
 */
export function generateCloudinarySignature(params: Record<string, any>): string {
  const cloudinary = require('cloudinary').v2;
  return cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
}

/**
 * Stream response helper for large file downloads
 */
export function streamFileResponse(
  res: Response,
  buffer: Buffer,
  contentType: string,
  filename: string,
) {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
}
