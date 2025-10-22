/**
 * KYC (Know Your Customer) Model
 *
 * Manages vendor identity verification and compliance documents.
 * Documents are encrypted at rest and watermarked to prevent reuse.
 *
 * Status Flow:
 * pending → submitted → under_review → verified OR rejected
 *
 * Required Documents (India):
 * - PAN (Permanent Account Number)
 * - GST (Goods and Services Tax) registration
 * - Aadhaar (optional for individual vendors)
 * - Bank account details
 * - Address proof
 * - Business registration (for companies)
 */

import { Schema, model, Document, Types } from 'mongoose';

/**
 * Document Type Enum
 */
export enum KYCDocumentType {
  PAN = 'pan',
  GST = 'gst',
  AADHAAR = 'aadhaar',
  BANK_ACCOUNT = 'bank_account',
  ADDRESS_PROOF = 'address_proof',
  BUSINESS_REGISTRATION = 'business_registration',
  CANCELLED_CHEQUE = 'cancelled_cheque',
  OTHER = 'other',
}

/**
 * KYC Status Enum
 */
export enum KYCStatus {
  PENDING = 'pending', // Initial state, vendor hasn't submitted
  SUBMITTED = 'submitted', // Vendor submitted, waiting for review
  UNDER_REVIEW = 'under_review', // Admin is reviewing documents
  VERIFIED = 'verified', // Approved by admin
  REJECTED = 'rejected', // Rejected by admin
  RESUBMISSION_REQUIRED = 'resubmission_required', // Need to resubmit docs
}

/**
 * Individual KYC Document
 */
export interface IKYCDocument {
  type: KYCDocumentType;
  fileUrl: string; // Cloudinary/S3 URL (encrypted)
  fileKey?: string; // Encryption key reference
  watermarkedUrl?: string; // Watermarked version URL
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId; // Admin who verified
  isVerified: boolean;
  rejectionReason?: string;
  metadata?: {
    originalFilename?: string;
    fileSize?: number;
    mimeType?: string;
    documentNumber?: string; // PAN/GST/Aadhaar number extracted
  };
}

/**
 * Bank Account Details
 */
export interface IBankAccount {
  accountHolderName: string;
  accountNumber: string; // Will be masked when displayed
  ifscCode: string;
  bankName: string;
  branchName?: string;
  accountType?: 'savings' | 'current';
  isVerified: boolean;
  verifiedAt?: Date;
}

/**
 * Business Details
 */
export interface IBusinessDetails {
  legalName: string;
  tradeName?: string;
  businessType:
    | 'individual'
    | 'proprietorship'
    | 'partnership'
    | 'private_limited'
    | 'public_limited'
    | 'llp';
  registrationNumber?: string;
  incorporationDate?: Date;
  registeredAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

/**
 * Status History Entry
 */
export interface IKYCStatusHistory {
  status: KYCStatus;
  changedBy: Types.ObjectId; // Admin or system
  changedAt: Date;
  reason?: string;
  notes?: string;
}

/**
 * KYC Document Interface
 */
export interface IKYC extends Document {
  _id: Types.ObjectId;
  vendorId: Types.ObjectId;

  // KYC Status
  status: KYCStatus;
  statusHistory: IKYCStatusHistory[];

  // Personal/Business Information
  businessDetails: IBusinessDetails;

  // Identity Documents
  documents: IKYCDocument[];

  // Tax Information
  panNumber?: string; // Masked when retrieved
  gstNumber?: string; // Masked when retrieved
  aadhaarNumber?: string; // Masked when retrieved (highly sensitive)

  // Bank Details
  bankAccount?: IBankAccount;

  // Verification Details
  submittedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId; // Admin user
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId;
  rejectionReason?: string;

  // Flags
  isVerified: boolean;
  canReceivePayouts: boolean; // Only true if KYC verified

  // Audit
  createdAt: Date;
  updatedAt: Date;

  // Methods
  submitForReview(): Promise<void>;
  approve(adminId: Types.ObjectId, notes?: string): Promise<void>;
  reject(adminId: Types.ObjectId, reason: string): Promise<void>;
  requestResubmission(adminId: Types.ObjectId, reason: string): Promise<void>;
  addDocument(document: Partial<IKYCDocument>): Promise<void>;
  maskSensitiveData(): IKYC;
}

/**
 * KYC Schema
 */
const kycDocumentSchema = new Schema<IKYCDocument>(
  {
    type: {
      type: String,
      enum: Object.values(KYCDocumentType),
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileKey: String,
    watermarkedUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: Date,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    rejectionReason: String,
    metadata: {
      originalFilename: String,
      fileSize: Number,
      mimeType: String,
      documentNumber: String,
    },
  },
  { _id: false },
);

const bankAccountSchema = new Schema<IBankAccount>(
  {
    accountHolderName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    branchName: String,
    accountType: {
      type: String,
      enum: ['savings', 'current'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,
  },
  { _id: false },
);

const businessDetailsSchema = new Schema<IBusinessDetails>(
  {
    legalName: {
      type: String,
      required: true,
    },
    tradeName: String,
    businessType: {
      type: String,
      enum: [
        'individual',
        'proprietorship',
        'partnership',
        'private_limited',
        'public_limited',
        'llp',
      ],
      required: true,
    },
    registrationNumber: String,
    incorporationDate: Date,
    registeredAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
  },
  { _id: false },
);

const statusHistorySchema = new Schema<IKYCStatusHistory>(
  {
    status: {
      type: String,
      enum: Object.values(KYCStatus),
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    reason: String,
    notes: String,
  },
  { _id: false },
);

const kycSchema = new Schema<IKYC>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.PENDING,
      index: true,
    },
    statusHistory: [statusHistorySchema],
    businessDetails: {
      type: businessDetailsSchema,
      required: true,
    },
    documents: [kycDocumentSchema],
    panNumber: {
      type: String,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, // PAN format: AAAAA9999A
    },
    gstNumber: {
      type: String,
      uppercase: true,
      trim: true,
      match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, // GST format
    },
    aadhaarNumber: {
      type: String,
      trim: true,
      match: /^[0-9]{12}$/, // Aadhaar: 12 digits
    },
    bankAccount: bankAccountSchema,
    submittedAt: Date,
    verifiedAt: Date,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: Date,
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    canReceivePayouts: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Indexes
 */
kycSchema.index({ status: 1, submittedAt: -1 });
kycSchema.index({ isVerified: 1, canReceivePayouts: 1 });
kycSchema.index({ 'businessDetails.legalName': 'text' });

/**
 * Methods
 */

/**
 * Submit KYC for admin review
 */
kycSchema.methods.submitForReview = async function (this: IKYC): Promise<void> {
  if (this.status !== KYCStatus.PENDING && this.status !== KYCStatus.RESUBMISSION_REQUIRED) {
    throw new Error(`Cannot submit KYC from status: ${this.status}`);
  }

  // Validate required documents
  const hasRequiredDocs =
    this.documents.some((d) => d.type === KYCDocumentType.PAN) &&
    this.documents.some((d) => d.type === KYCDocumentType.BANK_ACCOUNT);

  if (!hasRequiredDocs) {
    throw new Error('PAN and Bank Account documents are required');
  }

  this.status = KYCStatus.SUBMITTED;
  this.submittedAt = new Date();

  this.statusHistory.push({
    status: KYCStatus.SUBMITTED,
    changedBy: this.vendorId, // Self-submission
    changedAt: new Date(),
    notes: 'Vendor submitted KYC for review',
  });

  await this.save();
};

/**
 * Approve KYC (admin only)
 */
kycSchema.methods.approve = async function (
  this: IKYC,
  adminId: Types.ObjectId,
  notes?: string,
): Promise<void> {
  if (this.status !== KYCStatus.SUBMITTED && this.status !== KYCStatus.UNDER_REVIEW) {
    throw new Error(`Cannot approve KYC from status: ${this.status}`);
  }

  this.status = KYCStatus.VERIFIED;
  this.isVerified = true;
  this.canReceivePayouts = true;
  this.verifiedAt = new Date();
  this.verifiedBy = adminId;

  this.statusHistory.push({
    status: KYCStatus.VERIFIED,
    changedBy: adminId,
    changedAt: new Date(),
    notes: notes || 'KYC approved by admin',
  });

  await this.save();

  // TODO: Send email notification to vendor
  // TODO: Update Vendor model with KYC verified flag
};

/**
 * Reject KYC (admin only)
 */
kycSchema.methods.reject = async function (
  this: IKYC,
  adminId: Types.ObjectId,
  reason: string,
): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Rejection reason is required');
  }

  this.status = KYCStatus.REJECTED;
  this.isVerified = false;
  this.canReceivePayouts = false;
  this.rejectedAt = new Date();
  this.rejectedBy = adminId;
  this.rejectionReason = reason;

  this.statusHistory.push({
    status: KYCStatus.REJECTED,
    changedBy: adminId,
    changedAt: new Date(),
    reason,
  });

  await this.save();

  // TODO: Send email notification to vendor with rejection reason
};

/**
 * Request resubmission (admin only)
 */
kycSchema.methods.requestResubmission = async function (
  this: IKYC,
  adminId: Types.ObjectId,
  reason: string,
): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Resubmission reason is required');
  }

  this.status = KYCStatus.RESUBMISSION_REQUIRED;
  this.isVerified = false;
  this.canReceivePayouts = false;

  this.statusHistory.push({
    status: KYCStatus.RESUBMISSION_REQUIRED,
    changedBy: adminId,
    changedAt: new Date(),
    reason,
  });

  await this.save();

  // TODO: Send email notification to vendor
};

/**
 * Add a document to KYC
 */
kycSchema.methods.addDocument = async function (
  this: IKYC,
  document: Partial<IKYCDocument>,
): Promise<void> {
  if (!document.type || !document.fileUrl) {
    throw new Error('Document type and fileUrl are required');
  }

  // Remove existing document of same type (allow replacement)
  this.documents = this.documents.filter((d) => d.type !== document.type);

  this.documents.push({
    type: document.type,
    fileUrl: document.fileUrl,
    fileKey: document.fileKey,
    watermarkedUrl: document.watermarkedUrl,
    uploadedAt: new Date(),
    isVerified: false,
    metadata: document.metadata,
  } as IKYCDocument);

  await this.save();
};

/**
 * Mask sensitive data for display
 */
kycSchema.methods.maskSensitiveData = function (this: IKYC): IKYC {
  const masked = this.toObject();

  // Mask PAN: AAAAA9999A -> AAAAA****A
  if (masked.panNumber) {
    masked.panNumber = masked.panNumber.substring(0, 5) + '****' + masked.panNumber.substring(9);
  }

  // Mask GST: Show first 2 and last 3 characters
  if (masked.gstNumber) {
    const len = masked.gstNumber.length;
    masked.gstNumber =
      masked.gstNumber.substring(0, 2) + '*'.repeat(len - 5) + masked.gstNumber.substring(len - 3);
  }

  // Mask Aadhaar: 123456789012 -> ********9012
  if (masked.aadhaarNumber) {
    masked.aadhaarNumber = '********' + masked.aadhaarNumber.substring(8);
  }

  // Mask bank account: 1234567890 -> ******7890
  if (masked.bankAccount?.accountNumber) {
    const accNum = masked.bankAccount.accountNumber;
    masked.bankAccount.accountNumber =
      '*'.repeat(Math.max(0, accNum.length - 4)) + accNum.substring(accNum.length - 4);
  }

  return masked as IKYC;
};

/**
 * Pre-save middleware
 */
kycSchema.pre('save', function (next) {
  // Update canReceivePayouts based on verification status
  if (this.isModified('isVerified')) {
    this.canReceivePayouts = this.isVerified;
  }

  next();
});

/**
 * Export KYC Model
 */
export const KYC = model<IKYC>('KYC', kycSchema);
