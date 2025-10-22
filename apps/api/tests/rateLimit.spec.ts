import request from 'supertest';
import express from 'express';
import { rateLimit, rateLimiters, getRateLimitStatus } from '../src/middleware/rateLimit';
import { getRedis } from '../src/services/redis';

// Mock Redis for testing
jest.mock('../src/services/redis');
const mockGetRedis = getRedis as jest.MockedFunction<typeof getRedis>;

describe('Rate Limit Middleware', () => {
  let app: express.Application;
  let mockRedis: any;

  beforeEach(() => {
    // Create mock Redis client
    mockRedis = {
      pipeline: jest.fn().mockReturnValue({
        zremrangebyscore: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        zcard: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 1], // zremrangebyscore result
          [null, 1], // zadd result
          [null, 1], // zcard result (current count)
          [null, 1], // expire result
        ]),
      }),
    };
    mockGetRedis.mockReturnValue(mockRedis);

    // Create test app
    app = express();
    app.use(express.json());

    // Attach mock user for authenticated tests
    app.use((req: any, _res, next) => {
      if (req.headers['x-test-user']) {
        req.user = {
          id: 'user-123',
          role: (req.headers['x-test-role'] as string) || 'buyer',
        };
      }
      next();
    });

    app.use(rateLimit());
    app.get('/test', (_req, res) => res.json({ ok: true }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should allow requests within limit', async () => {
      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBeDefined();
      expect(res.headers['x-ratelimit-remaining']).toBeDefined();
      expect(res.headers['x-ratelimit-reset']).toBeDefined();
    });

    it('should return 429 when limit exceeded', async () => {
      // Mock Redis to return count exceeding limit
      mockRedis.pipeline.mockReturnValue({
        zremrangebyscore: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        zcard: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 1],
          [null, 1],
          [null, 101], // Exceeds anonymous limit of 100
          [null, 1],
        ]),
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Rate limit exceeded');
      expect(res.headers['retry-after']).toBeDefined();
    });

    it('should include rate limit headers in response', async () => {
      const res = await request(app).get('/test');

      expect(res.headers['x-ratelimit-limit']).toBe('100');
      expect(res.headers['x-ratelimit-remaining']).toBe('99');
      expect(res.headers['x-ratelimit-reset']).toMatch(/^\d+$/);
    });
  });

  describe('Adaptive limits by role', () => {
    it('should apply higher limit for authenticated users', async () => {
      const res = await request(app)
        .get('/test')
        .set('x-test-user', 'true')
        .set('x-test-role', 'buyer');

      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('300'); // Authenticated limit
    });

    it('should apply highest limit for admin users', async () => {
      const res = await request(app)
        .get('/test')
        .set('x-test-user', 'true')
        .set('x-test-role', 'admin');

      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('1000'); // Admin limit
    });

    it('should apply vendor limit for vendor users', async () => {
      const res = await request(app)
        .get('/test')
        .set('x-test-user', 'true')
        .set('x-test-role', 'vendor');

      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('300'); // Authenticated limit
    });
  });

  describe('Preset rate limiters', () => {
    it('should apply sensitive rate limit (10 req/min)', async () => {
      const sensitiveApp = express();
      sensitiveApp.use(rateLimiters.sensitive);
      sensitiveApp.post('/auth/login', (_req, res) => res.json({ ok: true }));

      const res = await request(sensitiveApp).post('/auth/login');

      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('10');
    });

    it('should apply strict rate limit (5 req/min)', async () => {
      const strictApp = express();
      strictApp.use(rateLimiters.strict);
      strictApp.post('/otp/request', (_req, res) => res.json({ ok: true }));

      const res = await request(strictApp).post('/otp/request');

      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('5');
    });

    it('should apply generous rate limit (500 req/min)', async () => {
      const generousApp = express();
      generousApp.use(rateLimiters.generous);
      generousApp.get('/products', (_req, res) => res.json({ ok: true }));

      const res = await request(generousApp).get('/products');

      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('500');
    });
  });

  describe('User vs IP identification', () => {
    it('should use user ID for authenticated requests', async () => {
      await request(app).get('/test').set('x-test-user', 'true');

      expect(mockRedis.pipeline).toHaveBeenCalled();
      const pipelineCalls = mockRedis.pipeline.mock.results[0].value;
      const zaddCall = pipelineCalls.zadd.mock.calls[0];

      // Key should contain user:user-123
      expect(zaddCall[0]).toContain('user:user-123');
    });

    it('should use IP address for anonymous requests', async () => {
      await request(app).get('/test');

      expect(mockRedis.pipeline).toHaveBeenCalled();
      const pipelineCalls = mockRedis.pipeline.mock.results[0].value;
      const zaddCall = pipelineCalls.zadd.mock.calls[0];

      // Key should contain ip:
      expect(zaddCall[0]).toContain('ip:');
    });
  });

  describe('Fail-open behavior', () => {
    it('should allow requests when Redis is unavailable', async () => {
      mockGetRedis.mockReturnValue(undefined as any);

      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('should allow requests when Redis operation fails', async () => {
      mockRedis.pipeline.mockReturnValue({
        zremrangebyscore: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        zcard: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });

  describe('getRateLimitStatus utility', () => {
    it('should return current rate limit status', async () => {
      mockRedis.zcount = jest.fn().mockResolvedValue(5);

      const mockReq = {
        ip: '127.0.0.1',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      } as any;
      const config = { windowMs: 60000, maxRequests: 100, keyPrefix: 'rl:test' };

      const status = await getRateLimitStatus(mockReq, config);

      expect(status.current).toBe(5);
      expect(status.limit).toBe(100);
      expect(status.remaining).toBe(95);
      expect(status.resetAt).toBeInstanceOf(Date);
    });

    it('should handle Redis errors gracefully', async () => {
      mockGetRedis.mockReturnValue(undefined as any);

      const mockReq = {
        ip: '127.0.0.1',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      } as any;
      const config = { windowMs: 60000, maxRequests: 100, keyPrefix: 'rl:test' };

      const status = await getRateLimitStatus(mockReq, config);

      expect(status.current).toBe(0);
      expect(status.limit).toBe(100);
      expect(status.remaining).toBe(100);
      expect(status.resetAt).toBeInstanceOf(Date);
    });
  });

  describe('Sliding window behavior', () => {
    it('should remove expired entries before counting', async () => {
      const windowMs = 60000; // 1 minute

      await request(app).get('/test');

      const pipelineCalls = mockRedis.pipeline.mock.results[0].value;
      const zremCall = pipelineCalls.zremrangebyscore.mock.calls[0];

      // Should remove entries older than now - windowMs
      expect(zremCall[1]).toBe(0);
      // Allow for small timing differences (< 10ms)
      expect(typeof zremCall[2]).toBe('number');
      expect(zremCall[2]).toBeGreaterThan(Date.now() - windowMs - 10);
    });

    it('should set expiry on the key', async () => {
      await request(app).get('/test');

      const pipelineCalls = mockRedis.pipeline.mock.results[0].value;
      const expireCall = pipelineCalls.expire.mock.calls[0];

      // Should set expiry to slightly more than window for safety
      expect(expireCall[1]).toBeGreaterThanOrEqual(60);
      expect(expireCall[1]).toBeLessThanOrEqual(120);
    });
  });

  describe('Multiple concurrent requests', () => {
    it('should handle burst of requests correctly', async () => {
      // Mock sequential counts
      let count = 0;
      mockRedis.pipeline.mockImplementation(() => ({
        zremrangebyscore: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        zcard: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 1],
          [null, 1],
          [null, ++count],
          [null, 1],
        ]),
      }));

      // Send 10 concurrent requests
      const promises = Array.from({ length: 10 }, () => request(app).get('/test'));
      const results = await Promise.all(promises);

      // All should succeed (count 1-10, limit is 100)
      results.forEach((res, i) => {
        expect(res.status).toBe(200);
        expect(parseInt(res.headers['x-ratelimit-remaining'])).toBe(100 - (i + 1));
      });
    });

    it('should reject requests exceeding burst limit', async () => {
      // Mock counts exceeding limit
      let count = 95;
      mockRedis.pipeline.mockImplementation(() => ({
        zremrangebyscore: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        zcard: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 1],
          [null, 1],
          [null, ++count],
          [null, 1],
        ]),
      }));

      // Send 10 requests (starting at count 95)
      const promises = Array.from({ length: 10 }, () => request(app).get('/test'));
      const results = await Promise.all(promises);

      // First 5 should succeed (96-100), last 5 should fail (101-105)
      const successful = results.filter((r) => r.status === 200);
      const rejected = results.filter((r) => r.status === 429);

      expect(successful.length).toBe(5);
      expect(rejected.length).toBe(5);
      rejected.forEach((res) => {
        expect(res.headers['retry-after']).toBeDefined();
      });
    });
  });
});
