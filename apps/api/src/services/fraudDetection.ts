// Fraud Detection Engine
import { Request } from 'express';
import crypto from 'crypto';
import { Vendor } from '../models/Vendor';
import { Refund } from '../models/Refund';
import { Dispute } from '../models/Dispute';
import { FraudBlacklist } from '../models/FraudBlacklist';

// In-memory velocity store (replace with Redis in prod)
const ipOrderTimestamps: { [ip: string]: number[] } = {};
const deviceOrderTimestamps: { [device: string]: number[] } = {};

export function getDeviceFingerprint(req: Request): string {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
  const ua = req.headers['user-agent'] || '';
  // Simple hash of IP + UA
  return crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex');
}

export function recordOrderAttempt(req: Request) {
  const now = Date.now();
  // IP velocity
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
  const ipStr = String(ip);
  ipOrderTimestamps[ipStr] = (ipOrderTimestamps[ipStr] || []).filter(
    (ts: number) => now - ts < 10 * 60 * 1000,
  ); // last 10 min
  ipOrderTimestamps[ipStr].push(now);
  // Device velocity
  const device = getDeviceFingerprint(req);
  deviceOrderTimestamps[device] = (deviceOrderTimestamps[device] || []).filter(
    (ts: number) => now - ts < 10 * 60 * 1000,
  );
  deviceOrderTimestamps[device].push(now);
}

export function isVelocityHigh(req: Request, maxPer10min = 5): boolean {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
  const device = getDeviceFingerprint(req);
  const ipStr = String(ip);
  return (
    (ipOrderTimestamps[ipStr]?.length || 0) > maxPer10min ||
    (deviceOrderTimestamps[device]?.length || 0) > maxPer10min
  );
}

export function getRiskScore({
  velocity,
  suspiciousDevice,
}: {
  velocity: boolean;
  suspiciousDevice: boolean;
}): number {
  let score = 0;
  if (velocity) score += 50;
  if (suspiciousDevice) score += 50;
  return score;
}

export function isSuspiciousDevice(device: string): boolean {
  // Stub: flag devices with >10 orders in 24h as suspicious
  const now = Date.now();
  const count = (deviceOrderTimestamps[device] || []).filter(
    (ts) => now - ts < 24 * 60 * 60 * 1000,
  ).length;
  return count > 10;
}

export async function checkVendorRefundSpike(vendorId: string, windowDays = 7, threshold = 5) {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const count = await Refund.countDocuments({ vendor: vendorId, createdAt: { $gte: since } });
  return count >= threshold;
}

export async function checkBuyerRefundAbuse(buyerId: string, windowDays = 30, threshold = 3) {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const count = await Refund.countDocuments({ buyer: buyerId, createdAt: { $gte: since } });
  return count >= threshold;
}

export async function isUpiBlacklisted(upi: string) {
  const bl = await FraudBlacklist.findOne();
  return bl?.upis.includes(upi) || false;
}

export async function isIfscBlacklisted(ifsc: string) {
  const bl = await FraudBlacklist.findOne();
  return bl?.ifsccodes.includes(ifsc) || false;
}

export async function shouldHoldPayout(vendorId: string, payoutAmount: number) {
  const vendor = await Vendor.findById(vendorId).select('avgPayout').lean();
  const avg = vendor && (vendor as any).avgPayout ? (vendor as any).avgPayout : 0;
  const recentDisputes = await Dispute.countDocuments({
    vendor: vendorId,
    status: 'open',
    createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
  });
  if (payoutAmount > avg * 2 || recentDisputes > 2) return true;
  return false;
}
