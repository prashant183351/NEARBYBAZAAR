import { pushOrderToSupplier, initializeRedis } from '../../src/services/dropship/outboundWebhook';
import Redis from 'ioredis';

// Mock Redis to simulate rate limiting
class MockRedis {
  zremrangebyscore = jest.fn();
  zcard = jest.fn();
  zadd = jest.fn();
  expire = jest.fn();
  pipeline() {
    return {
      zremrangebyscore: this.zremrangebyscore,
      zcard: this.zcard,
      zadd: this.zadd,
      expire: this.expire,
      exec: async () => [
        [null, null], // zremrangebyscore
        [null, 60],   // zcard returns 60 requests already in window
        [null, null], // zadd
        [null, null], // expire
      ],
    };
  }
  zrange = jest.fn(async () => [Date.now() - 60000, `${Date.now() - 60000}`]);
  del = jest.fn();
}

describe('pushOrderToSupplier - rate limiting', () => {
  beforeAll(() => {
    // Use the mock Redis instance
    const redis = new MockRedis();
    initializeRedis(redis as any as Redis);
  });

  it('should return rate_limited and queue for retry when rate limit exceeded', async () => {
    const order = { id: 'ORD-RATE-LIMIT', items: [], customer: {}, total: 0 };
    const supplier = { id: 'SUP-RATE-LIMIT', orderApiUrl: 'http://fake-supplier.com/api', rateLimitTier: 'default' };
    const result = await pushOrderToSupplier(order, supplier);
    expect(result.status).toBe('rate_limited');
    expect(result.queuedForRetry).toBe(true);
    expect(result.retryAfter).toBeDefined();
  });
});
