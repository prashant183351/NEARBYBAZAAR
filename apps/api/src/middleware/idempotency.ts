import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../services/redis';

/**
 * Idempotency key configuration
 */
export interface IdempotencyConfig {
  /**
   * TTL for idempotency keys in seconds
   * Default: 24 hours
   */
  ttl?: number;

  /**
   * Redis key prefix
   * Default: 'idempotency'
   */
  keyPrefix?: string;

  /**
   * Header name for idempotency key
   * Default: 'x-idempotency-key' or 'idempotency-key'
   */
  headerName?: string;

  /**
   * Whether idempotency key is required
   * Default: false
   */
  required?: boolean;
}

/**
 * Stored idempotency response
 */
interface IdempotentResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  timestamp: number;
}

const DEFAULT_CONFIG: Required<IdempotencyConfig> = {
  ttl: 24 * 60 * 60, // 24 hours
  keyPrefix: 'idempotency',
  headerName: 'x-idempotency-key',
  required: false,
};

/**
 * Middleware to handle idempotent requests
 * Prevents duplicate processing of critical operations (payments, webhooks, etc.)
 *
 * Usage:
 *   router.post('/payment', idempotency({ required: true }), handler);
 *   router.post('/webhook', idempotency({ ttl: 3600 }), handler);
 */
export function idempotency(config: IdempotencyConfig = {}) {
  const options = { ...DEFAULT_CONFIG, ...config };

  return async (req: Request, res: Response, next: NextFunction) => {
    const redis = getRedis();

    // Skip if Redis unavailable (fail open for availability)
    if (!redis) {
      req.log?.warn('Redis unavailable, skipping idempotency check');
      return next();
    }

    // Get idempotency key from headers
    const idempotencyKey =
      (req.headers[options.headerName] as string) || (req.headers['idempotency-key'] as string);

    // Check if key is required
    if (options.required && !idempotencyKey) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'IDEMPOTENCY_KEY_REQUIRED',
          message: `Header '${options.headerName}' is required for this endpoint`,
        },
      });
    }

    // If no key provided and not required, proceed normally
    if (!idempotencyKey) {
      return next();
    }

    // Validate key format (should be UUID or similar)
    if (idempotencyKey.length < 10 || idempotencyKey.length > 255) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IDEMPOTENCY_KEY',
          message: 'Idempotency key must be between 10 and 255 characters',
        },
      });
    }

    try {
      const key = `${options.keyPrefix}:${idempotencyKey}`;

      // Check if we've seen this key before
      const cached = await redis.get(key);

      if (cached) {
        // Return cached response
        const stored: IdempotentResponse = JSON.parse(cached);

        req.log?.info(
          {
            idempotencyKey,
            originalTimestamp: stored.timestamp,
          },
          'Returning cached idempotent response',
        );

        // Set original headers
        Object.entries(stored.headers).forEach(([name, value]) => {
          res.setHeader(name, value);
        });

        // Add idempotency replay header
        res.setHeader('X-Idempotency-Replay', 'true');

        return res.status(stored.statusCode).json(stored.body);
      }

      // First time seeing this key - intercept response
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);
      let responseSent = false;

      // Override json method
      res.json = function (body: any) {
        if (!responseSent) {
          responseSent = true;
          cacheResponse(redis, key, res.statusCode, body, options.ttl, req);
        }
        return originalJson(body);
      };

      // Override send method
      res.send = function (body: any) {
        if (!responseSent) {
          responseSent = true;
          cacheResponse(redis, key, res.statusCode, body, options.ttl, req);
        }
        return originalSend(body);
      };

      next();
    } catch (error) {
      req.log?.error({ err: error, idempotencyKey }, 'Idempotency check failed');
      // On error, proceed without idempotency (fail open)
      next();
    }
  };
}

/**
 * Cache the response for future idempotent requests
 */
async function cacheResponse(
  redis: any,
  key: string,
  statusCode: number,
  body: any,
  ttl: number,
  req: Request,
) {
  try {
    // Only cache successful responses (2xx, 3xx)
    if (statusCode >= 200 && statusCode < 400) {
      const stored: IdempotentResponse = {
        statusCode,
        headers: {
          'content-type': 'application/json',
        },
        body,
        timestamp: Date.now(),
      };

      await redis.setex(key, ttl, JSON.stringify(stored));

      req.log?.info(
        {
          idempotencyKey: key,
          statusCode,
          ttl,
        },
        'Cached idempotent response',
      );
    }
  } catch (error) {
    req.log?.error({ err: error }, 'Failed to cache idempotent response');
    // Don't throw - response already sent
  }
}

/**
 * Manually invalidate an idempotency key
 * Useful for testing or admin operations
 */
export async function invalidateIdempotencyKey(
  idempotencyKey: string,
  keyPrefix = 'idempotency',
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const key = `${keyPrefix}:${idempotencyKey}`;
    const result = await redis.del(key);
    return result > 0;
  } catch (error) {
    console.error('Failed to invalidate idempotency key:', error);
    return false;
  }
}

/**
 * Check if an idempotency key has been used
 */
export async function isIdempotencyKeyUsed(
  idempotencyKey: string,
  keyPrefix = 'idempotency',
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const key = `${keyPrefix}:${idempotencyKey}`;
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('Failed to check idempotency key:', error);
    return false;
  }
}
