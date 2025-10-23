import Redis from 'ioredis-mock';
import {
  getRateLimiter,
  getRetryQueue,
  RateLimitRetryQueue,
} from '../src/services/dropship/rateLimiter';

describe('SupplierRateLimiter/RetryQueue singleton and edge cases', () => {
  let redis: any;
  beforeEach(() => {
    redis = new Redis();
    // Reset singletons
    // @ts-ignore
    global.rateLimiterInstance = null;
    // @ts-ignore
    global.retryQueueInstance = null;
  });

  it('throws if getRateLimiter called without Redis', () => {
    // @ts-ignore
    global.rateLimiterInstance = null;
    expect(() => getRateLimiter()).toThrow('Redis instance required to initialize rate limiter');
  });

  it('returns singleton instance if already created', () => {
    const first = getRateLimiter(redis);
    const second = getRateLimiter();
    expect(first).toBe(second);
  });

  it('throws if getRetryQueue called without Redis', () => {
    // @ts-ignore
    global.retryQueueInstance = null;
    expect(() => getRetryQueue()).toThrow('Redis instance required to initialize retry queue');
  });

  it('returns singleton retry queue if already created', () => {
    const first = getRetryQueue(redis);
    const second = getRetryQueue();
    expect(first).toBe(second);
  });

  it('handles malformed JSON in getReadyRequests', async () => {
    const queue = new RateLimitRetryQueue(redis);
    const key = 'retry_queue:supplier:malformed';
    await redis.zadd(key, Date.now(), '{notjson');
    const ready = await queue.getReadyRequests('malformed');
    expect(ready).toEqual([]);
  });

  it('handles empty queue in getReadyRequests', async () => {
    const queue = new RateLimitRetryQueue(redis);
    const ready = await queue.getReadyRequests('empty');
    expect(ready).toEqual([]);
  });

  it('dequeue does not throw if item not present', async () => {
    const queue = new RateLimitRetryQueue(redis);
    await expect(queue.dequeue('none', 'notfound')).resolves.toBeUndefined();
  });

  it('clear does not throw if queue does not exist', async () => {
    const queue = new RateLimitRetryQueue(redis);
    await expect(queue.clear('none')).resolves.toBeUndefined();
  });
});
