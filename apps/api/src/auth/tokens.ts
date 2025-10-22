import { randomBytes } from 'crypto';
import { getRedis } from '../services/redis';

const REFRESH_TOKEN_TTL = parseInt(process.env.REFRESH_TOKEN_TTL || '1209600', 10); // default 14 days
const REFRESH_PREFIX = 'refresh:';

export function generateRefreshToken() {
  return randomBytes(32).toString('hex');
}

export async function storeRefreshToken(userId: string, token: string, deviceId?: string) {
  const redis = getRedis();
  if (!redis) return; // in tests or no redis, skip persistence
  const key = `${REFRESH_PREFIX}${token}`;
  const value = JSON.stringify({ userId, deviceId, createdAt: Date.now() });
  await redis.set(key, value, 'EX', REFRESH_TOKEN_TTL);
}

export async function rotateRefreshToken(oldToken: string, userId: string, deviceId?: string) {
  const newToken = generateRefreshToken();
  await revokeRefreshToken(oldToken);
  await storeRefreshToken(userId, newToken, deviceId);
  return newToken;
}

export async function getRefreshData(
  token: string,
): Promise<{ userId: string; deviceId?: string } | null> {
  const redis = getRedis();
  if (!redis) return null;
  const val = await redis.get(`${REFRESH_PREFIX}${token}`);
  if (!val) return null;
  try {
    const parsed = JSON.parse(val);
    return { userId: parsed.userId, deviceId: parsed.deviceId };
  } catch {
    return null;
  }
}

export async function revokeRefreshToken(token: string) {
  const redis = getRedis();
  if (!redis) return; // tests/no-redis
  await redis.del(`${REFRESH_PREFIX}${token}`);
}

export async function revokeAllForUser(_userId: string) {
  // Optional: maintain a user->tokens set for efficient revocation.
  // For now, not implemented to keep simple; can be added later for device-wide logout.
  return;
}
