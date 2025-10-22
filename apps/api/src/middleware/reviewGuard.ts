/**
 * Review Guard Middleware
 *
 * Spam detection and rate limiting for review submissions.
 * Uses Redis for velocity checks and IP tracking.
 */

import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { createHash } from 'crypto';

// Assuming Redis client exists (from earlier chunks)
// import { redisClient } from '../config/redis';

/**
 * Configuration
 */
const MAX_REVIEWS_PER_HOUR = parseInt(process.env.MAX_REVIEWS_PER_HOUR || '5', 10);
const MAX_REVIEWS_PER_DAY = parseInt(process.env.MAX_REVIEWS_PER_DAY || '10', 10);
const SUSPICIOUS_IP_THRESHOLD = parseInt(process.env.SUSPICIOUS_IP_THRESHOLD || '20', 10);
const MIN_REVIEW_LENGTH = parseInt(process.env.MIN_REVIEW_LENGTH || '10', 10);
// For future duplicate detection enhancement
// const DUPLICATE_SIMILARITY_THRESHOLD = parseFloat(process.env.DUPLICATE_SIMILARITY_THRESHOLD || '0.85');

/**
 * Spam detection result
 */
export interface ISpamDetection {
  isSpam: boolean;
  score: number;
  flags: {
    velocityFlag: boolean;
    duplicateContentFlag: boolean;
    suspiciousIPFlag: boolean;
    lowQualityFlag: boolean;
  };
  reason?: string;
}

/**
 * Hash IP address for privacy
 */
function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

/**
 * Get user IP from request
 */
function getUserIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Check review velocity (rate limiting)
 *
 * Uses Redis to track reviews per user per time period.
 */
async function checkVelocity(
  _userId: Types.ObjectId,
): Promise<{ exceeded: boolean; count: number }> {
  // TODO: Implement Redis-based rate limiting
  // For now, return stub

  // const now = Date.now();
  // const hourKey = `review:velocity:hour:${userId}:${Math.floor(now / 3600000)}`;
  // const dayKey = `review:velocity:day:${userId}:${Math.floor(now / 86400000)}`;

  // Simulated Redis calls (replace with actual implementation)
  // const hourCount = await redisClient.incr(hourKey);
  // await redisClient.expire(hourKey, 3600);
  // const dayCount = await redisClient.incr(dayKey);
  // await redisClient.expire(dayKey, 86400);

  const hourCount = 0; // Stub
  const dayCount = 0; // Stub

  const exceeded = hourCount > MAX_REVIEWS_PER_HOUR || dayCount > MAX_REVIEWS_PER_DAY;

  return { exceeded, count: hourCount };
}

/**
 * Check if IP is suspicious
 *
 * Tracks reviews per IP address to detect spam networks.
 */
async function checkSuspiciousIP(ip: string): Promise<boolean> {
  // TODO: Implement Redis-based IP tracking
  // For now, return stub

  // Reference ip to avoid unused variable error
  const _hashedIP = hashIP(ip);

  // const ipKey = `review:ip:${_hashedIP}`;
  // Simulated Redis call
  // const ipCount = await redisClient.incr(ipKey);
  // await redisClient.expire(ipKey, 86400); // 24 hour window

  const ipCount = 0; // Stub

  // Use _hashedIP in a no-op to avoid unused variable warning
  void _hashedIP;

  return ipCount > SUSPICIOUS_IP_THRESHOLD;
}

/**
 * Calculate text similarity (simple Jaccard similarity)
 *
 * Used to detect duplicate content.
 * Currently unused but prepared for future duplicate detection.
 */
// function calculateSimilarity(text1: string, text2: string): number {
//   const tokens1 = new Set(text1.toLowerCase().split(/\s+/));
//   const tokens2 = new Set(text2.toLowerCase().split(/\s+/));
//
//   const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
//   const union = new Set([...tokens1, ...tokens2]);
//
//   return intersection.size / union.size;
// }

/**
 * Check for duplicate content
 *
 * Compares against recent reviews from same user.
 */
async function checkDuplicateContent(_userId: Types.ObjectId, _comment: string): Promise<boolean> {
  // TODO: In production, fetch recent reviews from user
  // For now, return false (no duplicate)

  // Example implementation:
  // const recentReviews = await Review.find({
  //   userId,
  //   createdAt: { $gte: new Date(Date.now() - 7 * 86400000) }, // Last 7 days
  // }).limit(20);
  //
  // for (const review of recentReviews) {
  //   const similarity = calculateSimilarity(comment, review.comment);
  //   if (similarity > DUPLICATE_SIMILARITY_THRESHOLD) {
  //     return true;
  //   }
  // }

  return false;
}

/**
 * Check review quality
 *
 * Detects low-quality content (too short, generic, etc.)
 */
function checkQuality(comment: string): boolean {
  const trimmed = comment.trim();

  // Too short
  if (trimmed.length < MIN_REVIEW_LENGTH) {
    return false;
  }

  // Generic phrases (common spam patterns)
  const genericPhrases = [
    'good product',
    'nice',
    'ok',
    'fine',
    'awesome',
    'great',
    'bad',
    'terrible',
  ];

  const isGeneric = genericPhrases.some((phrase) => trimmed.toLowerCase() === phrase);

  if (isGeneric) {
    return false;
  }

  // Check for excessive repetition (e.g., "very very very good")
  const words = trimmed.split(/\s+/);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const repetitionRatio = uniqueWords.size / words.length;

  if (repetitionRatio < 0.5 && words.length > 5) {
    return false; // Too much repetition
  }

  return true;
}

/**
 * Detect spam
 *
 * Main spam detection function combining all heuristics.
 */
export async function detectSpam(
  userId: Types.ObjectId,
  comment: string,
  ip: string,
): Promise<ISpamDetection> {
  const flags = {
    velocityFlag: false,
    duplicateContentFlag: false,
    suspiciousIPFlag: false,
    lowQualityFlag: false,
  };

  let score = 0;
  const reasons: string[] = [];

  // Velocity check
  const velocity = await checkVelocity(userId);
  if (velocity.exceeded) {
    flags.velocityFlag = true;
    score += 30;
    reasons.push(`Too many reviews in short time (${velocity.count} in last hour)`);
  }

  // IP check
  const suspiciousIP = await checkSuspiciousIP(ip);
  if (suspiciousIP) {
    flags.suspiciousIPFlag = true;
    score += 20;
    reasons.push('Suspicious IP address');
  }

  // Duplicate content check
  const isDuplicate = await checkDuplicateContent(userId, comment);
  if (isDuplicate) {
    flags.duplicateContentFlag = true;
    score += 25;
    reasons.push('Similar to previous reviews');
  }

  // Quality check
  const isQuality = checkQuality(comment);
  if (!isQuality) {
    flags.lowQualityFlag = true;
    score += 15;
    reasons.push('Low quality content');
  }

  const isSpam = score >= 50; // Threshold for flagging as spam

  return {
    isSpam,
    score,
    flags,
    reason: reasons.length > 0 ? reasons.join('; ') : undefined,
  };
}

/**
 * Review Guard Middleware
 *
 * Applies rate limiting and spam detection to review submissions.
 * Attaches spam detection results to req for controller to use.
 */
export async function reviewGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extract user and review data
    const userId = (req as any).user?._id; // Assuming auth middleware attaches user
    const { comment } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required to post reviews',
      });
      return;
    }

    if (!comment) {
      res.status(400).json({
        success: false,
        error: 'Review comment is required',
      });
      return;
    }

    // Get user IP
    const ip = getUserIP(req);

    // Run spam detection
    const spamDetection = await detectSpam(userId, comment, ip);

    // Attach results to request for controller
    (req as any).spamDetection = spamDetection;
    (req as any).userIP = hashIP(ip); // Store hashed IP

    // If spam score is very high, reject immediately
    if (spamDetection.score >= 80) {
      res.status(429).json({
        success: false,
        error: 'Review submission rate limit exceeded. Please try again later.',
        retryAfter: 3600, // 1 hour
      });
      return;
    }

    // If moderate spam score, allow but flag for review
    if (spamDetection.isSpam) {
      console.warn(`[ReviewGuard] Flagged review from user ${userId}: ${spamDetection.reason}`);
      // Review will be created with FLAGGED status
    }

    next();
  } catch (error) {
    console.error('[ReviewGuard] Error in spam detection:', error);

    // On error, allow review but log for investigation
    (req as any).spamDetection = {
      isSpam: false,
      score: 0,
      flags: {
        velocityFlag: false,
        duplicateContentFlag: false,
        suspiciousIPFlag: false,
        lowQualityFlag: false,
      },
    };

    next();
  }
}

/**
 * Rate limit for reporting reviews
 *
 * Prevents abuse of the report system.
 */
export async function reportRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as any).user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required to report reviews',
      });
      return;
    }

    // TODO: Implement Redis-based rate limiting
    // For now, allow all reports

    // const reportKey = `report:limit:${userId}:${Math.floor(Date.now() / 3600000)}`;

    // Simulated check
    // const reportCount = await redisClient.incr(reportKey);
    // await redisClient.expire(reportKey, 3600);

    const MAX_REPORTS_PER_HOUR = 10;
    const reportCount = 0; // Stub

    if (reportCount > MAX_REPORTS_PER_HOUR) {
      res.status(429).json({
        success: false,
        error: 'Report rate limit exceeded. Please try again later.',
        retryAfter: 3600,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('[ReportRateLimit] Error:', error);
    next(); // Allow on error
  }
}
