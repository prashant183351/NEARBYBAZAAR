import { SupplierRateLimiter } from './rateLimiter';

describe('SupplierRateLimiter', () => {
  let redis: any;
  let limiter: SupplierRateLimiter;

  beforeEach(() => {
    // Use a simple in-memory mock for Redis
    redis = {
      pipeline: jest.fn(() => {
        const ops: any[] = [];
        return {
          zremrangebyscore: jest.fn((key, min, max) => {
            ops.push(['zremrangebyscore', key, min, max]);
            return this;
          }),
          zcard: jest.fn((key) => {
            ops.push(['zcard', key]);
            return this;
          }),
          zadd: jest.fn((key, score, value) => {
            ops.push(['zadd', key, score, value]);
            return this;
          }),
          expire: jest.fn((key, ttl) => {
            ops.push(['expire', key, ttl]);
            return this;
          }),
          exec: jest.fn(async () => [
            [null, null],
            [null, 0],
            [null, null],
            [null, null],
            [null, null],
          ]),
        };
      }),
      zrem: jest.fn(async () => 1),
      zrange: jest.fn(async () => ['oldest', `${Date.now() - 60000}`]),
      del: jest.fn(async () => 1),
      zremrangebyscore: jest.fn(async () => 1),
      zcard: jest.fn(async () => 0),
    };
    limiter = new SupplierRateLimiter(redis);
  });

  it('should allow requests under the limit', async () => {
    const result = await limiter.checkAndRecord('supplier1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('should fail open if Redis errors', async () => {
    limiter = new SupplierRateLimiter({
      pipeline: () => {
        throw new Error('Redis down');
      },
    } as any);
    const result = await limiter.checkAndRecord('supplier1');
    expect(result.allowed).toBe(true);
  });

  it('should reset rate limit for a supplier', async () => {
    await limiter.reset('supplier1');
    expect(redis.del).toHaveBeenCalledWith('rate_limit:supplier:supplier1');
  });

  it('should get status without recording', async () => {
    const result = await limiter.getStatus('supplier1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });
});
