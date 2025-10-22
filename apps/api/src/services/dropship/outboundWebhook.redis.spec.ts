import { getRetryQueue } from '../../src/services/dropship/rateLimiter';
import Redis from 'ioredis';

describe('RateLimitRetryQueue', () => {
  class MockRedis {
    zadd = jest.fn();
    expire = jest.fn();
    zrangebyscore = jest.fn();
    zrem = jest.fn();
    zcard = jest.fn();
    del = jest.fn();
  }

  let redis: any;
  let queue: any;
  const supplierId = 'SUP-RETRY-1';
  const requestData = { orderId: 'ORD-RETRY-1' };

  beforeEach(() => {
    redis = new MockRedis();
    queue = getRetryQueue(redis as any as Redis);
  });

  it('should enqueue a request for retry', async () => {
    await queue.enqueue(supplierId, requestData, 5000);
    expect(redis.zadd).toHaveBeenCalled();
    expect(redis.expire).toHaveBeenCalledWith(expect.stringContaining(supplierId), 3600);
  });

  it('should get ready requests for retry', async () => {
    const now = Date.now();
    const ready = [{ data: requestData, enqueuedAt: now - 6000, retryAt: now - 1000 }];
    redis.zrangebyscore.mockResolvedValue([JSON.stringify(ready[0])]);
    const result = await queue.getReadyRequests(supplierId);
    expect(result.length).toBe(1);
    expect(result[0].data.orderId).toBe('ORD-RETRY-1');
  });

  it('should dequeue a request after retry', async () => {
    await queue.dequeue(supplierId, JSON.stringify(requestData));
    expect(redis.zrem).toHaveBeenCalledWith(expect.stringContaining(supplierId), JSON.stringify(requestData));
  });

  it('should get queue length', async () => {
    redis.zcard.mockResolvedValue(2);
    const len = await queue.getQueueLength(supplierId);
    expect(len).toBe(2);
  });

  it('should clear the queue', async () => {
    await queue.clear(supplierId);
    expect(redis.del).toHaveBeenCalledWith(expect.stringContaining(supplierId));
  });
});
