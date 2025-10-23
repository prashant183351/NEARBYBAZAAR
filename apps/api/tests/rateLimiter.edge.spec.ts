import Redis from 'ioredis-mock';
import {
  SupplierRateLimiter,
  RateLimitRetryQueue,
  getRateLimiter,
  getRetryQueue,
  DEFAULT_RATE_LIMITS,
} from '../src/services/dropship/rateLimiter';

describe('SupplierRateLimiter edge/error cases', () => {
  it('should return average retryAfter if no oldest entry', async () => {
    // Patch pipeline to allow request, but zrange returns []
    redis.pipeline = jest.fn(() => ({
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, null], // zremrangebyscore
        [null, 2],   // zcard (simulate at limit)
        [null, null],
        [null, null],
        [null, null],
      ]),
    }));
    redis.zrem = jest.fn().mockResolvedValue(1);
    redis.zrange = jest.fn().mockResolvedValue([]);
    const result = await limiter.checkAndRecord('sup1');
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });
  let redis: any;
  let limiter: SupplierRateLimiter;

  beforeEach(() => {
    redis = new Redis();
    limiter = new SupplierRateLimiter(redis, { maxRequests: 2, windowMs: 100 });
  });

  it('should fail open if Redis pipeline fails', async () => {
    redis.pipeline = jest.fn(() => ({
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    }));
    const result = await limiter.checkAndRecord('failopen');
    expect(result.allowed).toBe(true);
  });

  it('should handle zrange error in retryAfter calculation', async () => {
    const origZrange = redis.zrange;
    redis.zrange = jest.fn().mockRejectedValue(new Error('fail'));
    // Fill up limit
    await limiter.checkAndRecord('zrange');
    await limiter.checkAndRecord('zrange');
    const result = await limiter.checkAndRecord('zrange');
    expect(result.allowed).toBe(true); // fail open
    redis.zrange = origZrange;
  });

  it('should handle getStatus Redis error', async () => {
    redis.zremrangebyscore = jest.fn().mockRejectedValue(new Error('fail'));
    const result = await limiter.getStatus('err');
    expect(result.allowed).toBe(true);
  });

  it('should handle reset Redis error gracefully', async () => {
    redis.del = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(limiter.reset('err')).rejects.toThrow('fail');
  });

  it('should return default config if unknown tier', () => {
    expect(limiter.getConfig('notatier' as any)).toEqual({ maxRequests: 2, windowMs: 100 });
  });
});

describe('RateLimitRetryQueue edge/error cases', () => {
  it('should handle malformed JSON in getReadyRequests', async () => {
    const key = 'retry_queue:supplier:sup1';
    await redis.zadd(key, Date.now(), '{bad json');
    const results = await queue.getReadyRequests('sup1');
    expect(results.length).toBe(0);
  });
  let redis: any;
  let queue: RateLimitRetryQueue;
  beforeEach(() => {
    redis = new Redis();
    queue = new RateLimitRetryQueue(redis);
  });

  it('should handle enqueue Redis error', async () => {
    redis.zadd = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(queue.enqueue('err', { foo: 1 }, 1)).rejects.toThrow('fail');
  });

  it('should handle getReadyRequests Redis error', async () => {
    redis.zrangebyscore = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(queue.getReadyRequests('err')).rejects.toThrow('fail');
  });

  it('should handle dequeue Redis error', async () => {
    redis.zrem = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(queue.dequeue('err', 'data')).rejects.toThrow('fail');
  });

  it('should handle getQueueLength Redis error', async () => {
    redis.zcard = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(queue.getQueueLength('err')).rejects.toThrow('fail');
  });

  it('should handle clear Redis error', async () => {
    redis.del = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(queue.clear('err')).rejects.toThrow('fail');
  });
});

describe('rateLimiter singleton exports', () => {
  it('should return singleton instance', () => {
    jest.resetModules();
    const Redis = require('ioredis-mock');
    const { getRateLimiter, getRetryQueue } = require('../src/services/dropship/rateLimiter');
    const redis = new Redis();
    const limiter1 = getRateLimiter(redis);
    const limiter2 = getRateLimiter();
    expect(limiter1).toBe(limiter2);
    const queue1 = getRetryQueue(redis);
    const queue2 = getRetryQueue();
    expect(queue1).toBe(queue2);
  });
  it('should throw if getRateLimiter/getRetryQueue called without Redis', () => {
    expect(() => getRateLimiter(undefined as any)).toThrow();
    expect(() => getRetryQueue(undefined as any)).toThrow();
  });
});
