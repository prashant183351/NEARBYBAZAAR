/**
 * ReviewReport Model
 *
 * Tracks user reports of reviews for moderation.
 * Allows users to flag spam, offensive content, or fake reviews.
 */

import { Schema, model, Document, Types } from 'mongoose';

/**
 * Report Reason
 */
export enum ReportReason {
  SPAM = 'spam',
  OFFENSIVE = 'offensive',
  FAKE = 'fake',
  INAPPROPRIATE = 'inappropriate',
  OFF_TOPIC = 'off_topic',
  OTHER = 'other',
}

/**
 * Report Status
 */
export enum ReportStatus {
  PENDING = 'pending', // Awaiting admin review
  REVIEWED = 'reviewed', // Admin has seen it
  RESOLVED = 'resolved', // Action taken (review removed/approved)
  DISMISSED = 'dismissed', // Report was invalid
}

/**
 * ReviewReport Interface
 */
export interface IReviewReport extends Document {
  _id: Types.ObjectId;

  // Target review
  reviewId: Types.ObjectId;

  // Reporter
  reportedBy: Types.ObjectId;
  reporterEmail?: string; // For follow-up if needed
  reporterIP?: string; // To prevent abuse of reporting

  // Report details
  reason: ReportReason;
  description?: string; // Optional additional context

  // Moderation
  status: ReportStatus;
  reviewedBy?: Types.ObjectId; // Admin who reviewed
  reviewedAt?: Date;
  adminNotes?: string; // Admin's decision notes
  actionTaken?: string; // What action was taken (if any)

  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  review(adminId: Types.ObjectId, notes?: string): Promise<void>;
  resolve(adminId: Types.ObjectId, actionTaken: string, notes?: string): Promise<void>;
  dismiss(adminId: Types.ObjectId, reason: string): Promise<void>;
}

/**
 * ReviewReport Schema
 */
const reviewReportSchema = new Schema<IReviewReport>(
  {
    // Target review
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: [true, 'Review ID is required'],
      index: true,
    },

    // Reporter
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter user ID is required'],
      index: true,
    },
    reporterEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    reporterIP: {
      type: String,
      trim: true,
    },

    // Report details
    reason: {
      type: String,
      enum: Object.values(ReportReason),
      required: [true, 'Report reason is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Moderation
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.PENDING,
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    actionTaken: {
      type: String,
      trim: true,
      maxlength: 200,
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
reviewReportSchema.index({ reviewId: 1, status: 1 });
reviewReportSchema.index({ status: 1, createdAt: 1 });
reviewReportSchema.index({ reportedBy: 1, createdAt: -1 });

// Prevent duplicate reports from same user for same review
reviewReportSchema.index({ reviewId: 1, reportedBy: 1 }, { unique: true });

/**
 * Instance Methods
 */

/**
 * Mark report as reviewed
 */
reviewReportSchema.methods.review = async function (
  adminId: Types.ObjectId,
  notes?: string,
): Promise<void> {
  if (this.status !== ReportStatus.PENDING) {
    throw new Error('Can only review pending reports');
  }

  this.status = ReportStatus.REVIEWED;
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.adminNotes = notes;

  await this.save();
};

/**
 * Resolve report (action was taken)
 */
reviewReportSchema.methods.resolve = async function (
  adminId: Types.ObjectId,
  actionTaken: string,
  notes?: string,
): Promise<void> {
  if (!actionTaken || actionTaken.trim().length === 0) {
    throw new Error('Action taken description is required');
  }

  this.status = ReportStatus.RESOLVED;
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.actionTaken = actionTaken;
  this.adminNotes = notes;

  await this.save();
};

/**
 * Dismiss report (no action needed)
 */
reviewReportSchema.methods.dismiss = async function (
  adminId: Types.ObjectId,
  reason: string,
): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Dismissal reason is required');
  }

  this.status = ReportStatus.DISMISSED;
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.adminNotes = `Dismissed: ${reason}`;

  await this.save();
};

/**
 * Static Methods
 */

/**
 * Get report count for a review
 */
reviewReportSchema.statics.getReportCountForReview = async function (
  reviewId: Types.ObjectId,
): Promise<number> {
  return await this.countDocuments({
    reviewId,
    status: { $ne: ReportStatus.DISMISSED },
  });
};

/**
 * Get pending reports count (for admin dashboard)
 */
reviewReportSchema.statics.getPendingCount = async function (): Promise<number> {
  return await this.countDocuments({ status: ReportStatus.PENDING });
};

/**
 * Check if user already reported a review
 */
reviewReportSchema.statics.hasUserReported = async function (
  reviewId: Types.ObjectId,
  userId: Types.ObjectId,
): Promise<boolean> {
  const count = await this.countDocuments({ reviewId, reportedBy: userId });
  return count > 0;
};

/**
 * Export model
 */
export const ReviewReport = model<IReviewReport>('ReviewReport', reviewReportSchema);
