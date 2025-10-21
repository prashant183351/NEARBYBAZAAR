import { Request, Response, NextFunction } from 'express';
import { CaptchaLog } from '../models/CaptchaLog';

const SQLI_PATTERNS = [
  /('|%27)\s*or\s*1=1/i,
  /('|%27)\s*or\s*'a'='a/i,
  /--|;|\/\*/i,
  /union\s+select/i,
  /select\s+.*\s+from/i,
];
const XSS_PATTERNS = [
  /<script.*?>/i,
  /onerror\s*=|onload\s*=/i,
  /<img.*?src=.*?>/i,
];

export function wafMiddleware(req: Request, res: Response, next: NextFunction) {
  const body = JSON.stringify(req.body || {});
  const query = JSON.stringify(req.query || {});
  let detected = false;
  let reason = '';

  for (const pat of SQLI_PATTERNS) {
    if (pat.test(body) || pat.test(query)) {
      detected = true;
      reason = 'SQL Injection pattern';
      break;
    }
  }
  if (!detected) {
    for (const pat of XSS_PATTERNS) {
      if (pat.test(body) || pat.test(query)) {
        detected = true;
        reason = 'XSS pattern';
        break;
      }
    }
  }
  // CSRF: Check referer/origin for state-changing requests
  if (!detected && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const referer = req.headers['referer'] || '';
    const origin = req.headers['origin'] || '';
    const allowedOrigins = (process.env.CORS_ALLOW_ORIGINS || '').split(',');
    const allowedOrigin = allowedOrigins[0] || '';
    if (referer && !referer.toString().startsWith(allowedOrigin)) {
      detected = true;
      reason = 'CSRF referer mismatch';
    }
    if (origin && !origin.toString().startsWith(allowedOrigin)) {
      detected = true;
      reason = 'CSRF origin mismatch';
    }
  }
  if (detected) {
    CaptchaLog.create({
      ip: req.ip,
      endpoint: req.originalUrl,
      success: false,
      reason: `WAF: ${reason}`,
    }).catch(() => {});
    return res.status(403).json({ error: 'Request blocked by security firewall.' });
  }
  next();
}
