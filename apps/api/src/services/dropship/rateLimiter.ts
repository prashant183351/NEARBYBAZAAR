/**
 * Supplier Rate Limiter
 * 
 * Implements Redis-based sliding window rate limiting for supplier API calls.
 * Prevents overwhelming supplier APIs by limiting requests per time window.
 * 
 * Features:
 * - Per-supplier rate limits
 * - Sliding window algorithm (more accurate than fixed window)
 * - Fair queueing (one slow supplier doesn't block others)
 * - Configurable limits and windows
 * - Retry queue for rate-limited requests
 */

import Redis from 'ioredis';

interface RateLimitConfig {
    maxRequests: number;    // Max requests allowed
    windowMs: number;       // Time window in milliseconds
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    retryAfter?: number;    // Milliseconds to wait before retry
}

/**
 * Default rate limit configurations per supplier
 * Can be overridden per supplier in database
 */
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
    default: {
        maxRequests: 60,        // 60 requests
        windowMs: 60 * 1000,    // per minute
    },
    // Conservative limit for new/untrusted suppliers
    conservative: {
        maxRequests: 30,
        windowMs: 60 * 1000,
    },
    // Higher limit for trusted/premium suppliers
    premium: {
        maxRequests: 120,
        windowMs: 60 * 1000,
    },
};

export class SupplierRateLimiter {
    private redis: Redis;
    private defaultConfig: RateLimitConfig;

    constructor(redis: Redis, defaultConfig?: RateLimitConfig) {
        this.redis = redis;
        this.defaultConfig = defaultConfig || DEFAULT_RATE_LIMITS.default;
    }

    /**
     * Check if request is allowed and record it
     * Uses sliding window algorithm for accurate rate limiting
     * 
     * @param supplierId Unique supplier identifier
     * @param config Optional rate limit config (overrides default)
     * @returns Rate limit result with allowed status
     */
    async checkAndRecord(
        supplierId: string,
        config?: RateLimitConfig
    ): Promise<RateLimitResult> {
        const limits = config || this.defaultConfig;
        const now = Date.now();
        const windowStart = now - limits.windowMs;
        const key = `rate_limit:supplier:${supplierId}`;

        try {
            // Use Redis pipeline for atomic operations
            const pipeline = this.redis.pipeline();

            // Remove old entries outside the window
            pipeline.zremrangebyscore(key, 0, windowStart);

            // Count requests in current window
            pipeline.zcard(key);

            // Add current request timestamp
            pipeline.zadd(key, now, `${now}-${Math.random()}`);

            // Set expiry to window size + buffer
            pipeline.expire(key, Math.ceil(limits.windowMs / 1000) + 60);

            const results = await pipeline.exec();

            if (!results) {
                throw new Error('Redis pipeline failed');
            }

            // Get count before adding current request
            const count = (results[1]?.[1] as number) || 0;
            const allowed = count < limits.maxRequests;

            // If not allowed, remove the request we just added
            if (!allowed) {
                await this.redis.zrem(key, `${now}-${Math.random()}`);
            }

            const remaining = Math.max(0, limits.maxRequests - count - (allowed ? 1 : 0));
            const resetAt = new Date(now + limits.windowMs);

            // Calculate retry delay if rate limited
            let retryAfter: number | undefined;
            if (!allowed) {
                // Get oldest timestamp in window
                const oldestEntries = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
                if (oldestEntries && oldestEntries.length >= 2) {
                    const oldestTimestamp = parseFloat(oldestEntries[1]);
                    retryAfter = Math.max(0, (oldestTimestamp + limits.windowMs) - now);
                } else {
                    retryAfter = limits.windowMs / limits.maxRequests; // Average spacing
                }
            }

            return {
                allowed,
                remaining,
                resetAt,
                retryAfter,
            };
        } catch (error) {
            console.error('Rate limiter error:', error);
            // Fail open - allow request if Redis is down
            return {
                allowed: true,
                remaining: limits.maxRequests,
                resetAt: new Date(now + limits.windowMs),
            };
        }
    }

    /**
     * Get current rate limit status without recording a request
     */
    async getStatus(
        supplierId: string,
        config?: RateLimitConfig
    ): Promise<RateLimitResult> {
        const limits = config || this.defaultConfig;
        const now = Date.now();
        const windowStart = now - limits.windowMs;
        const key = `rate_limit:supplier:${supplierId}`;

        try {
            // Remove old entries and count
            await this.redis.zremrangebyscore(key, 0, windowStart);
            const count = await this.redis.zcard(key);

            const allowed = count < limits.maxRequests;
            const remaining = Math.max(0, limits.maxRequests - count);
            const resetAt = new Date(now + limits.windowMs);

            return {
                allowed,
                remaining,
                resetAt,
            };
        } catch (error) {
            console.error('Rate limiter status error:', error);
            return {
                allowed: true,
                remaining: limits.maxRequests,
                resetAt: new Date(now + limits.windowMs),
            };
        }
    }

    /**
     * Reset rate limit for a supplier (admin function)
     */
    async reset(supplierId: string): Promise<void> {
        const key = `rate_limit:supplier:${supplierId}`;
        await this.redis.del(key);
    }

    /**
     * Get rate limit config for a supplier
     * In production, this could fetch from database
     */
    getConfig(supplierTier: 'default' | 'conservative' | 'premium' = 'default'): RateLimitConfig {
        return DEFAULT_RATE_LIMITS[supplierTier] || this.defaultConfig;
    }
}

/**
 * Retry Queue for rate-limited requests
 * Stores failed requests for later retry
 */
export class RateLimitRetryQueue {
    private redis: Redis;
    private queueKeyPrefix: string;

    constructor(redis: Redis, queueKeyPrefix = 'retry_queue:supplier') {
        this.redis = redis;
        this.queueKeyPrefix = queueKeyPrefix;
    }

    /**
     * Add request to retry queue
     */
    async enqueue(
        supplierId: string,
        requestData: any,
        retryAfter: number
    ): Promise<void> {
        const key = `${this.queueKeyPrefix}:${supplierId}`;
        const retryAt = Date.now() + retryAfter;

        await this.redis.zadd(
            key,
            retryAt,
            JSON.stringify({
                data: requestData,
                enqueuedAt: Date.now(),
                retryAt,
            })
        );

        // Set expiry to 1 hour to prevent infinite accumulation
        await this.redis.expire(key, 3600);
    }

    /**
     * Get requests ready for retry
     */
    async getReadyRequests(supplierId: string, limit = 10): Promise<any[]> {
        const key = `${this.queueKeyPrefix}:${supplierId}`;
        const now = Date.now();

        // Get requests with retryAt <= now
        const results = await this.redis.zrangebyscore(
            key,
            0,
            now,
            'LIMIT',
            0,
            limit
        );

        return results.map(r => {
            try {
                return JSON.parse(r);
            } catch {
                return null;
            }
        }).filter(Boolean);
    }

    /**
     * Remove request from queue after successful retry
     */
    async dequeue(supplierId: string, requestData: string): Promise<void> {
        const key = `${this.queueKeyPrefix}:${supplierId}`;
        await this.redis.zrem(key, requestData);
    }

    /**
     * Get queue length for a supplier
     */
    async getQueueLength(supplierId: string): Promise<number> {
        const key = `${this.queueKeyPrefix}:${supplierId}`;
        return await this.redis.zcard(key);
    }

    /**
     * Clear queue for a supplier
     */
    async clear(supplierId: string): Promise<void> {
        const key = `${this.queueKeyPrefix}:${supplierId}`;
        await this.redis.del(key);
    }
}

/**
 * Singleton instances
 */
let rateLimiterInstance: SupplierRateLimiter | null = null;
let retryQueueInstance: RateLimitRetryQueue | null = null;

/**
 * Get or create rate limiter instance
 */
export function getRateLimiter(redis?: Redis): SupplierRateLimiter {
    if (!rateLimiterInstance) {
        if (!redis) {
            throw new Error('Redis instance required to initialize rate limiter');
        }
        rateLimiterInstance = new SupplierRateLimiter(redis);
    }
    return rateLimiterInstance;
}

/**
 * Get or create retry queue instance
 */
export function getRetryQueue(redis?: Redis): RateLimitRetryQueue {
    if (!retryQueueInstance) {
        if (!redis) {
            throw new Error('Redis instance required to initialize retry queue');
        }
        retryQueueInstance = new RateLimitRetryQueue(redis);
    }
    return retryQueueInstance;
}

/**
 * Export default configurations
 */
export { DEFAULT_RATE_LIMITS };
