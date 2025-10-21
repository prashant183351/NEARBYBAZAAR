import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { getEnv } from '../utils/secrets';
import { CaptchaLog } from '../models/CaptchaLog';

const RECAPTCHA_SECRET = getEnv('RECAPTCHA_SECRET_KEY');
const MIN_SCORE = 0.5;

export async function verifyRecaptcha(req: Request, res: Response, next: NextFunction) {
  const token = req.body.recaptchaToken;
  const fingerprint = req.body.fingerprint;
  let headless = false;
  // Simple headless detection: missing User-Agent or known headless patterns
  const ua = req.headers['user-agent'] || '';
  if (!ua || /HeadlessChrome|puppeteer|phantomjs|selenium/i.test(ua)) {
    headless = true;
  }
  // If fingerprint seen > 10 times in last hour, mark as suspicious
  if (fingerprint) {
    const recent = await CaptchaLog.countDocuments({ fingerprint, timestamp: { $gt: Date.now() - 60 * 60 * 1000 } });
    if (recent > 10) {
      await CaptchaLog.create({
        ip: req.ip,
        endpoint: req.originalUrl,
        success: false,
        reason: 'Fingerprint rate limit',
        fingerprint,
        headless,
        timestamp: new Date(),
      });
      return res.status(429).json({ error: 'Too many requests from this device.' });
    }
  }
  if (!token) {
    await CaptchaLog.create({
      ip: req.ip,
      endpoint: req.originalUrl,
      success: false,
      reason: 'Missing token',
      timestamp: new Date(),
    });
    return res.status(400).json({ error: 'Please verify you are not a robot.' });
  }
  try {
    const params = new URLSearchParams();
    params.append('secret', RECAPTCHA_SECRET);
    params.append('response', token);
    if (req.ip) params.append('remoteip', req.ip);
    const resp = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { success, score, action } = resp.data;
    if (!success || score < MIN_SCORE) {
      await CaptchaLog.create({
        ip: req.ip,
        endpoint: req.originalUrl,
        success: false,
        reason: `Score too low (${score})`,
        score,
        action,
        timestamp: new Date(),
      });
      return res.status(400).json({ error: 'Captcha score too low.' });
    }
    await CaptchaLog.create({
      ip: req.ip,
      endpoint: req.originalUrl,
      success: true,
      score,
      action,
      timestamp: new Date(),
    });
    return next();
  } catch (err) {
    await CaptchaLog.create({
      ip: req.ip,
      endpoint: req.originalUrl,
      success: false,
      reason: 'Verification error',
      timestamp: new Date(),
    });
    return res.status(500).json({ error: 'Captcha verification failed.' });
  }
}
