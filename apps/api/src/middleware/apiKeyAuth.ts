import { ApiKey } from '../models/ApiKey';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Use type assertion to set custom fields on req
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'] || req.query.apiKey;
  if (!key) return res.status(401).json({ error: 'API key required' });
  const apiKey = await ApiKey.findOne({ key, active: true });
  if (!apiKey) return res.status(403).json({ error: 'Invalid or inactive API key' });
  if (apiKey.expiresAt && apiKey.expiresAt < new Date())
    return res.status(403).json({ error: 'API key expired' });
  (req as any).apiScopes = apiKey.scopes;
  (req as any).apiAppId = apiKey.appId;
  (req as any).apiKeyOwner = apiKey.owner;
  next();
}

export function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).apiScopes || !(req as any).apiScopes.includes(scope)) {
      return res.status(403).json({ error: 'Insufficient scope' });
    }
    next();
  };
}

export function verifyHmac(req: Request, secret: string) {
  const signature = req.headers['x-signature'];
  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return signature === hmac;
}
