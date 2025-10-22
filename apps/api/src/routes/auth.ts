import { Router } from 'express';
import argon2 from 'argon2';
import { z } from 'zod';
import { User } from '../models/User';
import { signJwt } from '../auth/jwt';
import { sanitize } from '../middleware/sanitize';
import { validate } from '../middleware/validate';
import {
  generateRefreshToken,
  getRefreshData,
  rotateRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
} from '../auth/tokens';
import { logAuditEvent } from '../models/ImmutableAudit';
import { rateLimiters } from '../middleware/rateLimit';
import { logFailedLogin } from '../middleware/security';
import { emailQueue } from '../queues';

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['user', 'vendor', 'admin']).default('user'),
});

router.post(
  '/signup',
  rateLimiters.sensitive,
  sanitize({ body: { email: 'plain', password: 'plain', fingerprint: 'plain' } }),
  validate(signupSchema),
  async (req, res) => {
    const { email, password, name } = req.body;
    const fingerprint = getFingerprint(req);
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const hash = await argon2.hash(password);
    const user = new User({ email, password: hash, name, lastFingerprint: fingerprint });
    await user.save();
    const jwt = signJwt({ id: user.id, email: user.email, role: user.role as any });
    const refresh = generateRefreshToken();
    await storeRefreshToken(user.id, refresh, req.headers['user-agent'] as string | undefined);
    await logAuditEvent({
      userId: user.id,
      action: 'signup',
      resource: 'auth',
      resourceId: user.id,
      metadata: { email: user.email, userAgent: req.headers['user-agent'], fingerprint },
    }).catch((err) => console.error('Audit log failed:', err));
    res.json({
      token: jwt,
      refreshToken: refresh,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  },
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const getFingerprint = (req: any) => req.body.fingerprint || req.headers['x-fingerprint'] || '';

router.post(
  '/login',
  rateLimiters.sensitive,
  sanitize({ body: { email: 'plain', password: 'plain', fingerprint: 'plain' } }),
  validate(loginSchema),
  async (req, res) => {
    const { email, password } = req.body;
    const fingerprint = getFingerprint(req);
    const user = await User.findOne({ email, deleted: false });
    if (!user) {
      logFailedLogin(req, email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const ok = await argon2.verify(user.password, password);
    if (!ok) {
      logFailedLogin(req, email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Device fingerprint check
    if (user.lastFingerprint && user.lastFingerprint !== fingerprint) {
      // Optionally require OTP or send notification
      // For now, send notification email
      await emailQueue.add('send', {
        to: user.email,
        subject: 'New device login detected',
        text: `A login to your account was detected from a new device or browser. If this was not you, please reset your password.`,
      });
    }
    user.lastFingerprint = fingerprint;
    await user.save();
    const jwt = signJwt({ id: user.id, email: user.email, role: user.role as any });
    const refresh = generateRefreshToken();
    await storeRefreshToken(user.id, refresh, req.headers['user-agent'] as string | undefined);
    // Audit log login
    await logAuditEvent({
      userId: user.id,
      action: 'login',
      resource: 'auth',
      resourceId: user.id,
      metadata: { email: user.email, userAgent: req.headers['user-agent'], fingerprint },
    }).catch((err) => console.error('Audit log failed:', err));
    res.json({
      token: jwt,
      refreshToken: refresh,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  },
);

const refreshSchema = z.object({ refreshToken: z.string().min(1) });
router.post(
  '/refresh',
  sanitize({ body: { refreshToken: 'plain' } }),
  validate(refreshSchema),
  async (req, res) => {
    const { refreshToken } = req.body;
    const data = await getRefreshData(refreshToken);
    if (!data) return res.status(401).json({ error: 'Invalid refresh token' });
    const user = await User.findById(data.userId);
    if (!user || user.deleted) return res.status(401).json({ error: 'Invalid refresh token' });
    const newRefresh = await rotateRefreshToken(
      refreshToken,
      user.id,
      req.headers['user-agent'] as string | undefined,
    );
    const jwt = signJwt({ id: user.id, email: user.email, role: user.role as any });
    res.json({ token: jwt, refreshToken: newRefresh });
  },
);

const logoutSchema = z.object({ refreshToken: z.string().min(1) });
router.post(
  '/logout',
  sanitize({ body: { refreshToken: 'plain' } }),
  validate(logoutSchema),
  async (req, res) => {
    const { refreshToken } = req.body;
    const data = await getRefreshData(refreshToken);
    await revokeRefreshToken(refreshToken);

    // Audit log logout
    if (data?.userId) {
      await logAuditEvent({
        userId: data.userId,
        action: 'logout',
        resource: 'auth',
        resourceId: data.userId,
        metadata: { userAgent: req.headers['user-agent'] },
      }).catch((err) => console.error('Audit log failed:', err));
    }

    res.json({ success: true });
  },
);

const passwordResetSchema = z.object({
  email: z.string().email(),
});

router.post(
  '/password-reset',
  rateLimiters.sensitive,
  sanitize({ body: { email: 'plain', fingerprint: 'plain' } }),
  validate(passwordResetSchema),
  async (req, res) => {
    const { email } = req.body;
    const fingerprint = getFingerprint(req);
    const user = await User.findOne({ email, deleted: false });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.lastFingerprint && user.lastFingerprint !== fingerprint) {
      await emailQueue.add('send', {
        to: user.email,
        subject: 'Password reset requested from new device',
        text: `A password reset was requested from a new device or browser. If this was not you, please contact support.`,
      });
    }
    user.lastFingerprint = fingerprint;
    await user.save();
    // ...existing password reset logic...
    res.json({ success: true });
  },
);

export default router;
