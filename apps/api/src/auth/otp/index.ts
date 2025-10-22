import { Router } from 'express';
import { z } from 'zod';
import { sanitize } from '../../middleware/sanitize';
import { validate } from '../../middleware/validate';
import { sendMail } from '../../services/mailer';
import { User } from '../../models/User';
import speakeasy from 'speakeasy';
import crypto from 'crypto';
import { getRedis } from '../../services/redis';
import { rateLimiters } from '../../middleware/rateLimit';

const router = Router();

const OTP_TTL = parseInt(process.env.EMAIL_OTP_TTL || '300', 10); // 5 minutes
const OTP_PREFIX = 'otp:';
const BACKUP_PREFIX = 'backup:';

function otpKey(email: string) {
  return `${OTP_PREFIX}${email}`;
}

function backupKey(userId: string) {
  return `${BACKUP_PREFIX}${userId}`;
}

function hash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// Request an email OTP for login or sensitive actions
const otpRequestSchema = z.object({ email: z.string().email() });
router.post(
  '/request',
  rateLimiters.strict,
  sanitize({ body: { email: 'plain' } }),
  validate(otpRequestSchema),
  async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email, deleted: false });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const redis = getRedis();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    if (redis) {
      await redis.setex(otpKey(email), OTP_TTL, hash(code));
    }
    await sendMail({
      to: email,
      subject: 'Your NearbyBazaar verification code',
      text: `Your verification code is ${code}. It expires in ${Math.floor(OTP_TTL / 60)} minutes.`,
    });
    res.json({ success: true });
  },
);

// Verify email OTP
const otpVerifySchema = z.object({ email: z.string().email(), code: z.string().min(4) });
router.post(
  '/verify',
  sanitize({ body: { email: 'plain', code: 'plain' } }),
  validate(otpVerifySchema),
  async (req, res) => {
    const { email, code } = req.body;
    const user = await User.findOne({ email, deleted: false });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const redis = getRedis();
    if (!redis) return res.status(503).json({ error: 'OTP service unavailable' });
    const stored = await redis.get(otpKey(email));
    if (!stored || stored !== hash(code)) return res.status(401).json({ error: 'Invalid code' });
    await redis.del(otpKey(email));
    res.json({ success: true, userId: user.id });
  },
);

// TOTP enable: returns otpauth URL and QR info; requires basic auth in your app flow
const totpEnableSchema = z.object({ userId: z.string() });
router.post(
  '/totp/enable',
  sanitize({ body: { userId: 'plain' } }),
  validate(totpEnableSchema),
  async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user || user.deleted) return res.status(404).json({ error: 'User not found' });
    const secret = speakeasy.generateSecret({ name: `NearbyBazaar (${user.email})` });
    // Store temp secret in Redis until verified
    const redis = getRedis();
    if (redis) await redis.setex(`totp:pending:${userId}`, 600, secret.base32);
    res.json({ otpauth_url: secret.otpauth_url, base32: secret.base32 });
  },
);

// TOTP verify (finalize enabling)
const totpVerifySchema = z.object({ userId: z.string(), token: z.string() });
router.post(
  '/totp/verify',
  sanitize({ body: { userId: 'plain', token: 'plain' } }),
  validate(totpVerifySchema),
  async (req, res) => {
    const { userId, token } = req.body;
    const user = await User.findById(userId);
    if (!user || user.deleted) return res.status(404).json({ error: 'User not found' });
    const redis = getRedis();
    const base32 = redis ? await redis.get(`totp:pending:${userId}`) : null;
    if (!base32) return res.status(400).json({ error: 'No pending TOTP secret' });
    const ok = speakeasy.totp.verify({ secret: base32, encoding: 'base32', token, window: 1 });
    if (!ok) return res.status(401).json({ error: 'Invalid token' });
    // Persist the TOTP secret on user (hashed or encrypted ideally; for demo, store base32)
    (user as any).totpSecret = base32;
    await user.save();
    if (redis) await redis.del(`totp:pending:${userId}`);
    res.json({ success: true });
  },
);

// TOTP verify for login
const totpLoginSchema = z.object({ userId: z.string(), token: z.string() });
router.post(
  '/totp/login',
  sanitize({ body: { userId: 'plain', token: 'plain' } }),
  validate(totpLoginSchema),
  async (req, res) => {
    const { userId, token } = req.body;
    const user = await User.findById(userId);
    if (!user || user.deleted) return res.status(404).json({ error: 'User not found' });
    const base32 = (user as any).totpSecret as string | undefined;
    if (!base32) return res.status(400).json({ error: '2FA not enabled' });
    const ok = speakeasy.totp.verify({ secret: base32, encoding: 'base32', token, window: 1 });
    if (!ok) return res.status(401).json({ error: 'Invalid token' });
    res.json({ success: true });
  },
);

// Backup codes: generate and store hashed, one-time use
const backupGenerateSchema = z.object({
  userId: z.string(),
  count: z.number().min(1).max(20).default(10),
});
router.post(
  '/backup/generate',
  sanitize({ body: { userId: 'plain', count: 'plain' } }),
  validate(backupGenerateSchema),
  async (req, res) => {
    const { userId, count } = req.body;
    const user = await User.findById(userId);
    if (!user || user.deleted) return res.status(404).json({ error: 'User not found' });
    const codes: string[] = [];
    for (let i = 0; i < (count || 10); i++) {
      codes.push(crypto.randomBytes(5).toString('hex'));
    }
    const hashed = codes.map((c) => hash(c));
    const redis = getRedis();
    if (redis) await redis.set(backupKey(userId), JSON.stringify(hashed));
    res.json({ codes });
  },
);

const backupVerifySchema = z.object({ userId: z.string(), code: z.string() });
router.post(
  '/backup/verify',
  sanitize({ body: { userId: 'plain', code: 'plain' } }),
  validate(backupVerifySchema),
  async (req, res) => {
    const { userId, code } = req.body;
    const redis = getRedis();
    if (!redis) return res.status(503).json({ error: 'Backup service unavailable' });
    const raw = await redis.get(backupKey(userId));
    if (!raw) return res.status(404).json({ error: 'No backup codes' });
    let arr: string[] = [];
    try {
      arr = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'Corrupted backup store' });
    }
    const h = hash(code);
    const idx = arr.indexOf(h);
    if (idx === -1) return res.status(401).json({ error: 'Invalid code' });
    // consume one-time code
    arr.splice(idx, 1);
    await redis.set(backupKey(userId), JSON.stringify(arr));
    res.json({ success: true, remaining: arr.length });
  },
);

export default router;
