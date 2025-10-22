/**
 * Review Model
 *
 * Manages product and store reviews with spam detection and moderation.
 * Supports shadow-banning, reporting, and verified purchase badges.
 */

import { Schema, model, Document, Types } from 'mongoose';

/**
 * Review Status
 */
export enum ReviewStatus {
  PENDING = 'pending', // Awaiting moderation (if auto-moderation enabled)
  APPROVED = 'approved', // Visible to all users
  FLAGGED = 'flagged', // Flagged by spam detection, needs review
  REMOVED = 'removed', // Removed by admin
  SHADOW_BANNED = 'shadow_banned', // Invisible to others, visible to author
}

/**
 * Review Type
 */
export enum ReviewType {
  PRODUCT = 'product',
  VENDOR = 'vendor',
  SERVICE = 'service',
}

/**
 * Spam Detection Flags
 */
export interface ISpamFlags {
  velocityFlag: boolean; // Too many reviews in short time
  duplicateContentFlag: boolean; // Similar content to other reviews
  suspiciousIPFlag: boolean; // IP address has spam history
  lowQualityFlag: boolean; // Very short or generic content
  multipleReportsFlag: boolean; // Multiple user reports
}

/**
 * Review Interface
 */
export interface IReview extends Document {
  _id: Types.ObjectId;

  // Target entity
  type: ReviewType;
  productId?: Types.ObjectId;
  vendorId?: Types.ObjectId;
  serviceId?: Types.ObjectId;

  // Review author
  userId: Types.ObjectId;
  userName?: string; // Cached for display
  userEmail?: string; // For moderation

  // Review content
  rating: number; // 1-5 stars
  title?: string; // Optional review title
  comment: string; // Review text
  images?: string[]; // Optional image URLs

  // Verification
  isVerifiedPurchase: boolean; // Did user actually buy this?
  orderId?: Types.ObjectId; // Reference to order (if verified)
  purchaseDate?: Date; // When they purchased (for "Verified Buyer" badge)

  // Moderation
  status: ReviewStatus;
  isShadowBanned: boolean; // If true, only author can see

  // Spam detection
  spamScore: number; // 0-100 (higher = more likely spam)
  spamFlags: ISpamFlags;

  // Reporting
  reportCount: number; // How many users reported this
  lastReportedAt?: Date;

  // Moderation history
  moderatedBy?: Types.ObjectId; // Admin who took action
  moderatedAt?: Date;
  moderationNotes?: string;

  // Metadata
  ipAddress?: string; // For spam detection (hashed)
  userAgent?: string; // Browser fingerprint

  // Helpful votes
  helpfulCount: number; // Users who found this helpful
  notHelpfulCount: number;

  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateSpamScore(): number;
  flagAsSpam(reason: string): Promise<void>;
  approve(adminId: Types.ObjectId, notes?: string): Promise<void>;
  remove(adminId: Types.ObjectId, reason: string): Promise<void>;
  shadowBan(adminId: Types.ObjectId, reason: string): Promise<void>;
  isVisibleTo(userId?: Types.ObjectId, isAdmin?: boolean): boolean;
}

/**
 * Spam Flags Schema
 */
const spamFlagsSchema = new Schema<ISpamFlags>(
  {
    velocityFlag: { type: Boolean, default: false },
    duplicateContentFlag: { type: Boolean, default: false },
    suspiciousIPFlag: { type: Boolean, default: false },
    lowQualityFlag: { type: Boolean, default: false },
    multipleReportsFlag: { type: Boolean, default: false },
  },
  { _id: false },
);

/**
 * Review Schema
 */
const reviewSchema = new Schema<IReview>(
  {
    // Target entity (at least one required)
    type: {
      type: String,
      enum: Object.values(ReviewType),
      required: [true, 'Review type is required'],
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      index: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      index: true,
    },

    // Author
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Content
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],

    // Verification
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    purchaseDate: {
      type: Date,
    },

    // Moderation
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.PENDING,
      index: true,
    },
    isShadowBanned: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Spam detection
    spamScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    spamFlags: {
      type: spamFlagsSchema,
      default: () => ({
        velocityFlag: false,
        duplicateContentFlag: false,
        suspiciousIPFlag: false,
        lowQualityFlag: false,
        multipleReportsFlag: false,
      }),
    },

    // Reporting
    reportCount: {
      type: Number,
      default: 0,
      index: true,
    },
    lastReportedAt: {
      type: Date,
    },

    // Moderation history
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: {
      type: Date,
    },
    moderationNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Metadata
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },

    // Helpful votes
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Indexes
 */

// Composite indexes for common queries
reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ vendorId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ status: 1, spamScore: -1 });
reviewSchema.index({ status: 1, reportCount: -1 });
reviewSchema.index({ isShadowBanned: 1, userId: 1 });

// Text index for search
reviewSchema.index({ comment: 'text', title: 'text' });

/**
 * Validation
 */

// Ensure at least one target entity is provided
reviewSchema.pre('validate', function (next) {
  if (!this.productId && !this.vendorId && !this.serviceId) {
    next(new Error('At least one of productId, vendorId, or serviceId must be provided'));
  } else {
    next();
  }
});

// Ensure verified purchase has order reference
reviewSchema.pre('validate', function (next) {
  if (this.isVerifiedPurchase && !this.orderId) {
    next(new Error('Verified purchase reviews must have an orderId'));
  } else {
    next();
  }
});

/**
 * Instance Methods
 */

/**
 * Calculate spam score based on flags
 */
reviewSchema.methods.calculateSpamScore = function (): number {
  let score = 0;

  if (this.spamFlags.velocityFlag) score += 30;
  if (this.spamFlags.duplicateContentFlag) score += 25;
  if (this.spamFlags.suspiciousIPFlag) score += 20;
  if (this.spamFlags.lowQualityFlag) score += 15;
  if (this.spamFlags.multipleReportsFlag) score += 10;

  // Additional scoring
  if (this.reportCount > 5) score += 20;
  if (this.comment.length < 20) score += 10; // Very short reviews

  // Cap at 100
  return Math.min(score, 100);
};

/**
 * Flag as spam
 */
reviewSchema.methods.flagAsSpam = async function (reason: string): Promise<void> {
  this.status = ReviewStatus.FLAGGED;
  this.spamScore = this.calculateSpamScore();
  this.moderationNotes = `Auto-flagged: ${reason}`;
  await this.save();
};

/**
 * Approve review
 */
reviewSchema.methods.approve = async function (
  adminId: Types.ObjectId,
  notes?: string,
): Promise<void> {
  if (this.status === ReviewStatus.REMOVED) {
    throw new Error('Cannot approve a removed review');
  }

  this.status = ReviewStatus.APPROVED;
  this.isShadowBanned = false;
  this.moderatedBy = adminId;
  this.moderatedAt = new Date();
  this.moderationNotes = notes || 'Approved by admin';
  this.spamScore = 0; // Clear spam score

  await this.save();
};

/**
 * Remove review
 */
reviewSchema.methods.remove = async function (
  adminId: Types.ObjectId,
  reason: string,
): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Reason is required to remove a review');
  }

  this.status = ReviewStatus.REMOVED;
  this.moderatedBy = adminId;
  this.moderatedAt = new Date();
  this.moderationNotes = `Removed: ${reason}`;

  await this.save();
};

/**
 * Shadow ban review
 *
 * Review remains visible to author but hidden from others.
 * Used for soft moderation without alerting spammers.
 */
reviewSchema.methods.shadowBan = async function (
  adminId: Types.ObjectId,
  reason: string,
): Promise<void> {
  this.status = ReviewStatus.SHADOW_BANNED;
  this.isShadowBanned = true;
  this.moderatedBy = adminId;
  this.moderatedAt = new Date();
  this.moderationNotes = `Shadow banned: ${reason}`;

  await this.save();
};

/**
 * Check if review is visible to a given user
 *
 * @param userId - User viewing the review (optional for anonymous)
 * @param isAdmin - Is the viewer an admin?
 * @returns true if review should be visible
 */
reviewSchema.methods.isVisibleTo = function (
  userId?: Types.ObjectId,
  isAdmin: boolean = false,
): boolean {
  // Admins can see everything
  if (isAdmin) {
    return true;
  }

  // Removed reviews are hidden to everyone except admins
  if (this.status === ReviewStatus.REMOVED) {
    return false;
  }

  // Shadow-banned reviews only visible to author
  if (this.isShadowBanned || this.status === ReviewStatus.SHADOW_BANNED) {
    return userId && this.userId.equals(userId);
  }

  // Pending reviews only visible to author
  if (this.status === ReviewStatus.PENDING) {
    return userId && this.userId.equals(userId);
  }

  // Flagged reviews only visible to author (until reviewed)
  if (this.status === ReviewStatus.FLAGGED) {
    return userId && this.userId.equals(userId);
  }

  // Approved reviews visible to all
  return this.status === ReviewStatus.APPROVED;
};

/**
 * Pre-save middleware
 */

// Recalculate spam score when flags change
reviewSchema.pre('save', function (next) {
  if (this.isModified('spamFlags') || this.isModified('reportCount')) {
    this.spamScore = this.calculateSpamScore();

    // Auto-flag if spam score exceeds threshold
    if (this.spamScore >= 50 && this.status === ReviewStatus.APPROVED) {
      this.status = ReviewStatus.FLAGGED;
    }
  }
  next();
});

// Update lastReportedAt when reportCount increases
reviewSchema.pre('save', function (next) {
  if (this.isModified('reportCount') && this.reportCount > 0) {
    this.lastReportedAt = new Date();

    // Flag for multiple reports
    if (this.reportCount >= 3) {
      this.spamFlags.multipleReportsFlag = true;
    }
  }
  next();
});

/**
 * Export model
 */
export const Review = model<IReview>('Review', reviewSchema);
