import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../services/redis';
import { UserClaims } from '../auth/jwt';

/**
 * Rate limit configuration per route/user type
 */
export interface RateLimitConfig {
    windowMs: number;        // Time window in milliseconds
    maxRequests: number;     // Max requests per window
    keyPrefix?: string;      // Redis key prefix
    skipSuccessfulRequests?: boolean;  // Don't count successful requests
    skipFailedRequests?: boolean;      // Don't count failed requests
}

/**
 * Default rate limits
 */
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
    // Anonymous users: stricter limits
    anonymous: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 100,         // 100 requests/minute
        keyPrefix: 'rl:anon',
    },
    // Authenticated users: higher limits
    authenticated: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 300,         // 300 requests/minute
        keyPrefix: 'rl:auth',
    },
    // Admin users: even higher limits
    admin: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 1000,        // 1000 requests/minute
        keyPrefix: 'rl:admin',
    },
    // Sensitive endpoints (auth, payments): strict limits
    sensitive: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 10,          // 10 requests/minute
        keyPrefix: 'rl:sensitive',
    },
};

/**
 * Get identifier for rate limiting (user ID or IP)
 */
function getIdentifier(req: Request): string {
    const user: UserClaims | undefined = (req as any).user;
    
    if (user?.id) {
        return `user:${user.id}`;
    }
    
    // Fallback to IP address
    const ip = req.ip || 
               req.headers['x-forwarded-for'] as string ||
               req.headers['x-real-ip'] as string ||
               req.socket.remoteAddress ||
               'unknown';
    
    return `ip:${Array.isArray(ip) ? ip[0] : ip}`;
}

/**
 * Get appropriate rate limit config based on user context
 */
function getRateLimitConfig(req: Request, customConfig?: Partial<RateLimitConfig>): RateLimitConfig {
    const user: UserClaims | undefined = (req as any).user;
    
    let baseConfig: RateLimitConfig;
    
    if (user?.role === 'admin') {
        baseConfig = DEFAULT_LIMITS.admin;
    } else if (user) {
        baseConfig = DEFAULT_LIMITS.authenticated;
    } else {
        baseConfig = DEFAULT_LIMITS.anonymous;
    }
    
    // Merge with custom config if provided
    return { ...baseConfig, ...customConfig };
}

/**
 * Sliding window rate limiter using Redis
 */
export function rateLimit(customConfig?: Partial<RateLimitConfig>) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const redis = getRedis();
        
        // Skip rate limiting if Redis unavailable (development/test mode)
        if (!redis) {
            return next();
        }
        
        try {
            const config = getRateLimitConfig(req, customConfig);
            const identifier = getIdentifier(req);
            const key = `${config.keyPrefix}:${identifier}`;
            const now = Date.now();
            const windowStart = now - config.windowMs;
            
            // Use Redis sorted set for sliding window
            // Score is timestamp, member is unique request ID
            const requestId = `${now}:${Math.random()}`;
            
            // Start transaction
            const pipeline = redis.pipeline();
            
            // Remove old entries outside the window
            pipeline.zremrangebyscore(key, 0, windowStart);
            
            // Add current request
            pipeline.zadd(key, now, requestId);
            
            // Count requests in window
            pipeline.zcard(key);
            
            // Set expiry on key (window + buffer)
            pipeline.expire(key, Math.ceil(config.windowMs / 1000) + 10);
            
            const results = await pipeline.exec();
            
            if (!results) {
                throw new Error('Redis pipeline failed');
            }
            
            // Extract count from pipeline results
            const count = results[2]?.[1] as number;
            
            // Calculate remaining and reset time
            const remaining = Math.max(0, config.maxRequests - count);
            const resetTime = now + config.windowMs;
            
            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', config.maxRequests);
            res.setHeader('X-RateLimit-Remaining', remaining);
            res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
            
            // Check if limit exceeded
            if (count > config.maxRequests) {
                const retryAfter = Math.ceil((resetTime - now) / 1000);
                res.setHeader('Retry-After', retryAfter);
                
                return res.status(429).json({
                    error: 'Too many requests',
                    message: 'Rate limit exceeded. Please try again later.',
                    retryAfter,
                });
            }
            
            next();
        } catch (error) {
            console.error('Rate limit error:', error);
            // On error, allow request to proceed (fail open)
            next();
        }
    };
}

/**
 * Preset rate limiters for common use cases
 */
export const rateLimiters = {
    // Standard API endpoints
    standard: rateLimit(),
    
    // Sensitive endpoints (auth, payments)
    sensitive: rateLimit({
        maxRequests: 10,
        windowMs: 60 * 1000,
        keyPrefix: 'rl:sensitive',
    }),
    
    // Very strict (e.g., password reset, OTP)
    strict: rateLimit({
        maxRequests: 5,
        windowMs: 60 * 1000,
        keyPrefix: 'rl:strict',
    }),
    
    // Generous (e.g., read-only public APIs)
    generous: rateLimit({
        maxRequests: 500,
        windowMs: 60 * 1000,
        keyPrefix: 'rl:generous',
    }),
};

/**
 * Get current rate limit status for a user/IP (for debugging/monitoring)
 */
export async function getRateLimitStatus(req: Request, config: RateLimitConfig): Promise<{
    current: number;
    limit: number;
    remaining: number;
    resetAt: Date;
}> {
    const redis = getRedis();
    
    if (!redis) {
        return {
            current: 0,
            limit: config.maxRequests,
            remaining: config.maxRequests,
            resetAt: new Date(Date.now() + config.windowMs),
        };
    }
    
    const identifier = getIdentifier(req);
    const key = `${config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Count current requests in window
    const count = await redis.zcount(key, windowStart, now);
    
    return {
        current: count,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - count),
        resetAt: new Date(now + config.windowMs),
    };
}
