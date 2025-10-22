/**
 * KYC Service
 *
 * Handles KYC document operations with security measures:
 * - Document encryption at rest
 * - Watermarking with vendor ID and timestamp
 * - Secure document upload and retrieval
 * - Data masking for sensitive information
 * - Document verification helpers
 */

import crypto from 'crypto';
import { Types } from 'mongoose';
import { KYC, IKYC, KYCDocumentType, KYCStatus } from '../models/KYC';

/**
 * Configuration
 */
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.KYC_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

/**
 * Document Upload Result
 */
export interface IDocumentUploadResult {
  fileUrl: string;
  watermarkedUrl: string;
  fileKey: string;
  metadata: {
    originalFilename: string;
    fileSize: number;
    mimeType: string;
  };
}

/**
 * KYC Summary (for admin dashboards)
 */
export interface IKYCSummary {
  totalKYCs: number;
  pending: number;
  submitted: number;
  underReview: number;
  verified: number;
  rejected: number;
  resubmissionRequired: number;
}

/**
 * Encrypt sensitive data
 */
export function encryptData(text: string): { encrypted: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encrypted: string, ivHex: string, authTagHex: string): string {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate watermark text for KYC documents
 */
export function generateWatermarkText(vendorId: Types.ObjectId): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `NearbyBazaar - Vendor: ${vendorId.toString().substring(0, 8)} - ${timestamp} - CONFIDENTIAL`;
}

/**
 * Validate PAN format
 */
export function validatePAN(pan: string): { isValid: boolean; error?: string } {
  if (!pan || typeof pan !== 'string') {
    return { isValid: false, error: 'PAN is required' };
  }

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  if (!panRegex.test(pan.toUpperCase())) {
    return {
      isValid: false,
      error: 'Invalid PAN format. Expected format: AAAAA9999A (e.g., ABCDE1234F)',
    };
  }

  return { isValid: true };
}

/**
 * Validate GST format
 */
export function validateGST(gst: string): { isValid: boolean; error?: string } {
  if (!gst || typeof gst !== 'string') {
    return { isValid: false, error: 'GST number is required' };
  }

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!gstRegex.test(gst.toUpperCase())) {
    return {
      isValid: false,
      error: 'Invalid GST format. Expected 15 characters (e.g., 29ABCDE1234F1Z5)',
    };
  }

  // Validate that PAN is embedded in GST (characters 3-12)
  const embeddedPAN = gst.substring(2, 12);
  const panCheck = validatePAN(embeddedPAN);

  if (!panCheck.isValid) {
    return {
      isValid: false,
      error: 'Invalid GST: Embedded PAN is invalid',
    };
  }

  return { isValid: true };
}

/**
 * Validate Aadhaar format
 */
export function validateAadhaar(aadhaar: string): { isValid: boolean; error?: string } {
  if (!aadhaar || typeof aadhaar !== 'string') {
    return { isValid: false, error: 'Aadhaar number is required' };
  }

  // Remove spaces and hyphens
  const cleaned = aadhaar.replace(/[\s-]/g, '');

  const aadhaarRegex = /^[0-9]{12}$/;

  if (!aadhaarRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid Aadhaar format. Expected 12 digits',
    };
  }

  // Aadhaar doesn't start with 0 or 1
  if (cleaned.startsWith('0') || cleaned.startsWith('1')) {
    return {
      isValid: false,
      error: 'Invalid Aadhaar: Cannot start with 0 or 1',
    };
  }

  return { isValid: true };
}

/**
 * Validate IFSC code format
 */
export function validateIFSC(ifsc: string): { isValid: boolean; error?: string } {
  if (!ifsc || typeof ifsc !== 'string') {
    return { isValid: false, error: 'IFSC code is required' };
  }

  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

  if (!ifscRegex.test(ifsc.toUpperCase())) {
    return {
      isValid: false,
      error: 'Invalid IFSC format. Expected format: AAAA0BBBBBB (e.g., SBIN0001234)',
    };
  }

  return { isValid: true };
}

/**
 * Extract document number from file using OCR (stub)
 * TODO: Integrate with actual OCR service (Google Vision, AWS Textract, etc.)
 */
export async function extractDocumentNumber(
  fileUrl: string,
  documentType: KYCDocumentType,
): Promise<string | null> {
  // Stub implementation - returns null
  // In production, this would:
  // 1. Download image from fileUrl
  // 2. Run OCR to extract text
  // 3. Parse text to find document number based on type
  // 4. Validate extracted number

  console.log(`[KYC Service] OCR extraction stub for ${documentType} at ${fileUrl}`);
  return null;
}

/**
 * Upload KYC document with watermarking
 *
 * This is a stub that simulates the upload process.
 * In production, integrate with Cloudinary or S3 with watermarking.
 */
export async function uploadKYCDocument(
  vendorId: Types.ObjectId,
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  },
  documentType: KYCDocumentType,
): Promise<IDocumentUploadResult> {
  // Generate watermark text
  const watermarkText = generateWatermarkText(vendorId);

  // TODO: In production:
  // 1. Upload original file to secure storage (encrypted)
  // 2. Generate watermarked version with overlay:
  //    - vendorId (first 8 chars)
  //    - Current date
  //    - "CONFIDENTIAL" text
  //    - Diagonal overlay across image
  // 3. Store both versions
  // 4. Return URLs and encryption key

  // Stub implementation
  const fileKey = crypto.randomBytes(16).toString('hex');
  const fileUrl = `https://storage.nearbybazaar.com/kyc/${vendorId}/${fileKey}_original_${file.originalname}`;
  const watermarkedUrl = `https://storage.nearbybazaar.com/kyc/${vendorId}/${fileKey}_watermarked_${file.originalname}`;

  console.log(`[KYC Service] Document upload stub:`);
  console.log(`  - Type: ${documentType}`);
  console.log(`  - Vendor: ${vendorId}`);
  console.log(`  - Watermark: ${watermarkText}`);
  console.log(`  - Original URL: ${fileUrl}`);
  console.log(`  - Watermarked URL: ${watermarkedUrl}`);

  return {
    fileUrl,
    watermarkedUrl,
    fileKey,
    metadata: {
      originalFilename: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    },
  };
}

/**
 * Create or get KYC for vendor
 */
export async function getOrCreateKYC(
  vendorId: Types.ObjectId,
  businessDetails?: any,
): Promise<IKYC> {
  let kyc = await KYC.findOne({ vendorId });

  if (!kyc) {
    // Create new KYC with initial status
    kyc = new KYC({
      vendorId,
      status: KYCStatus.PENDING,
      businessDetails: businessDetails || {
        legalName: 'Unknown',
        businessType: 'individual',
        registeredAddress: {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
        },
      },
      statusHistory: [
        {
          status: KYCStatus.PENDING,
          changedBy: vendorId,
          changedAt: new Date(),
          notes: 'KYC record created',
        },
      ],
    });

    await kyc.save();
  }

  return kyc;
}

/**
 * Get KYC by vendor ID with optional masking
 */
export async function getKYCByVendorId(
  vendorId: Types.ObjectId,
  maskData: boolean = true,
): Promise<IKYC | null> {
  const kyc = await KYC.findOne({ vendorId })
    .populate('verifiedBy', 'name email')
    .populate('rejectedBy', 'name email')
    .populate('statusHistory.changedBy', 'name email');

  if (!kyc) {
    return null;
  }

  if (maskData) {
    return kyc.maskSensitiveData();
  }

  return kyc;
}

/**
 * Get all KYCs (admin only)
 */
export async function getAllKYCs(filters?: {
  status?: KYCStatus;
  isVerified?: boolean;
  limit?: number;
  skip?: number;
}): Promise<{ kycs: IKYC[]; total: number }> {
  const query: any = {};

  if (filters?.status) {
    query.status = filters.status;
  }

  if (filters?.isVerified !== undefined) {
    query.isVerified = filters.isVerified;
  }

  const limit = filters?.limit || 20;
  const skip = filters?.skip || 0;

  const [kycs, total] = await Promise.all([
    KYC.find(query)
      .populate('vendorId', 'name email storeName')
      .populate('verifiedBy', 'name email')
      .sort({ submittedAt: -1 })
      .limit(limit)
      .skip(skip),
    KYC.countDocuments(query),
  ]);

  // Mask sensitive data for all KYCs
  const maskedKYCs = kycs.map((kyc) => kyc.maskSensitiveData());

  return { kycs: maskedKYCs, total };
}

/**
 * Get KYC summary statistics
 */
export async function getKYCSummary(): Promise<IKYCSummary> {
  const [totalKYCs, statusCounts] = await Promise.all([
    KYC.countDocuments(),
    KYC.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const summary: IKYCSummary = {
    totalKYCs,
    pending: 0,
    submitted: 0,
    underReview: 0,
    verified: 0,
    rejected: 0,
    resubmissionRequired: 0,
  };

  for (const item of statusCounts) {
    switch (item._id) {
      case KYCStatus.PENDING:
        summary.pending = item.count;
        break;
      case KYCStatus.SUBMITTED:
        summary.submitted = item.count;
        break;
      case KYCStatus.UNDER_REVIEW:
        summary.underReview = item.count;
        break;
      case KYCStatus.VERIFIED:
        summary.verified = item.count;
        break;
      case KYCStatus.REJECTED:
        summary.rejected = item.count;
        break;
      case KYCStatus.RESUBMISSION_REQUIRED:
        summary.resubmissionRequired = item.count;
        break;
    }
  }

  return summary;
}

/**
 * Update KYC status (admin action)
 */
export async function updateKYCStatus(
  vendorId: Types.ObjectId,
  newStatus: KYCStatus,
  adminId: Types.ObjectId,
  reason?: string,
): Promise<IKYC> {
  const kyc = await KYC.findOne({ vendorId });

  if (!kyc) {
    throw new Error('KYC not found for vendor');
  }

  // Use model methods for status transitions
  switch (newStatus) {
    case KYCStatus.VERIFIED:
      await kyc.approve(adminId, reason);
      break;

    case KYCStatus.REJECTED:
      if (!reason) {
        throw new Error('Rejection reason is required');
      }
      await kyc.reject(adminId, reason);
      break;

    case KYCStatus.RESUBMISSION_REQUIRED:
      if (!reason) {
        throw new Error('Resubmission reason is required');
      }
      await kyc.requestResubmission(adminId, reason);
      break;

    case KYCStatus.UNDER_REVIEW:
      kyc.status = KYCStatus.UNDER_REVIEW;
      kyc.statusHistory.push({
        status: KYCStatus.UNDER_REVIEW,
        changedBy: adminId,
        changedAt: new Date(),
        notes: reason || 'Moved to under review',
      });
      await kyc.save();
      break;

    default:
      throw new Error(`Invalid status transition to: ${newStatus}`);
  }

  return kyc.maskSensitiveData();
}

/**
 * Verify that KYC is complete and approved
 */
export async function verifyKYCForPayouts(vendorId: Types.ObjectId): Promise<boolean> {
  const kyc = await KYC.findOne({ vendorId });

  if (!kyc) {
    return false;
  }

  return kyc.isVerified && kyc.canReceivePayouts;
}

/**
 * Get KYC pending review count (for admin dashboard)
 */
export async function getPendingReviewCount(): Promise<number> {
  return await KYC.countDocuments({
    status: { $in: [KYCStatus.SUBMITTED, KYCStatus.UNDER_REVIEW] },
  });
}

/**
 * Bulk approve KYCs (admin operation)
 */
export async function bulkApproveKYCs(
  vendorIds: Types.ObjectId[],
  adminId: Types.ObjectId,
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const vendorId of vendorIds) {
    try {
      const kyc = await KYC.findOne({ vendorId });

      if (!kyc) {
        results.failed++;
        results.errors.push(`KYC not found for vendor: ${vendorId}`);
        continue;
      }

      if (kyc.status !== KYCStatus.SUBMITTED && kyc.status !== KYCStatus.UNDER_REVIEW) {
        results.failed++;
        results.errors.push(`Invalid status for vendor ${vendorId}: ${kyc.status}`);
        continue;
      }

      await kyc.approve(adminId, 'Bulk approval');
      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(`Error approving ${vendorId}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Check if specific document type is uploaded and verified
 */
export function hasVerifiedDocument(kyc: IKYC, documentType: KYCDocumentType): boolean {
  return kyc.documents.some((doc) => doc.type === documentType && doc.isVerified);
}

/**
 * Get missing required documents
 */
export function getMissingDocuments(kyc: IKYC): KYCDocumentType[] {
  const required = [KYCDocumentType.PAN, KYCDocumentType.BANK_ACCOUNT];

  const uploaded = kyc.documents.map((d) => d.type);

  return required.filter((type) => !uploaded.includes(type));
}

/**
 * Validate KYC completeness before submission
 */
export function validateKYCCompleteness(kyc: IKYC): { isComplete: boolean; missing: string[] } {
  const missing: string[] = [];

  // Check required documents
  if (!kyc.documents.some((d) => d.type === KYCDocumentType.PAN)) {
    missing.push('PAN card document');
  }

  if (!kyc.documents.some((d) => d.type === KYCDocumentType.BANK_ACCOUNT)) {
    missing.push('Bank account proof');
  }

  // Check PAN number
  if (!kyc.panNumber) {
    missing.push('PAN number');
  }

  // Check bank details
  if (!kyc.bankAccount) {
    missing.push('Bank account details');
  }

  // Check business details
  if (!kyc.businessDetails?.legalName) {
    missing.push('Business legal name');
  }

  if (!kyc.businessDetails?.registeredAddress?.pincode) {
    missing.push('Registered address');
  }

  return {
    isComplete: missing.length === 0,
    missing,
  };
}
