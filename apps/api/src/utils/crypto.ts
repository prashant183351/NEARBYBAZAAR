import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY = process.env.ERP_SECRET_KEY
  ? Buffer.from(process.env.ERP_SECRET_KEY, 'hex')
  : crypto.randomBytes(32);

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  let encrypted = cipher.update(plain, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(enc: string): string {
  const [ivHex, tagHex, dataHex] = enc.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function maskSecret(secret: string): string {
  if (!secret) return '';
  const visible = secret.slice(-4);
  return `****${visible}`;
}

// Prevent logging secrets: always mask before logging
// Example usage: console.log(maskSecret(decryptSecret(...)))
