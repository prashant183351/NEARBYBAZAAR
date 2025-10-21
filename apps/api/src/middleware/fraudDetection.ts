// Fraud detection middleware
import { Request, Response, NextFunction } from 'express';
import { recordOrderAttempt, isVelocityHigh, getDeviceFingerprint, isSuspiciousDevice, getRiskScore } from '../services/fraudDetection';
import { logger } from '../utils/logger';

export function fraudDetectionMiddleware(req: Request, _res: Response, next: NextFunction) {
  recordOrderAttempt(req);
  const velocity = isVelocityHigh(req);
  const device = getDeviceFingerprint(req);
  const suspiciousDevice = isSuspiciousDevice(device);
  const riskScore = getRiskScore({ velocity, suspiciousDevice });
  // Attach risk info to request for downstream use
  (req as any).fraudRisk = { riskScore, velocity, suspiciousDevice };
  if (riskScore >= 50) {
    logger.warn(`[FraudDetection] High risk order: score=${riskScore}, ip=${req.ip}, device=${device}`);
    // Optionally: require 2FA, block, or flag for review
    // return res.status(403).json({ success: false, error: 'Order flagged for review' });
  }
  next();
}
