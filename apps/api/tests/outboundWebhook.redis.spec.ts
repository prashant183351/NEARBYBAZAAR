1551;

import Redis from 'ioredis-mock';
import { initializeRedis } from '../src/services/dropship/outboundWebhook';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockOrder = { id: 'ORD-REDIS-1', items: [], customer: {}, total: 10 };
const mockSupplier = {
  id: 'SUP-REDIS-1',
  orderApiUrl: 'https://api.supplier.com/orders',
  rateLimitTier: 'default',
  companyName: 'Test Supplier',
};

describe('Dropship OutboundWebhook Rate Limit & Retry', () => {
  let redis: any;
  let rateLimiter: any;
  let retryQueue: any;
  let syncJobCreateSpy: jest.SpyInstance;

  beforeEach(() => {
    redis = new Redis();
    initializeRedis(redis);
    rateLimiter = {
      getConfig: jest.fn().mockReturnValue({ windowMs: 1000, max: 1 }),
      checkAndRecord: jest.fn(),
    };
    retryQueue = {
      enqueue: jest.fn(),
      getReadyRequests: jest.fn(),
      dequeue: jest.fn(),
    };
    jest
      .spyOn(require('../src/services/dropship/rateLimiter'), 'getRateLimiter')
      .mockReturnValue(rateLimiter);
    jest
      .spyOn(require('../src/services/dropship/rateLimiter'), 'getRetryQueue')
      .mockReturnValue(retryQueue);
    mockedAxios.post.mockClear();
    // Mock SyncJob.create to avoid real MongoDB calls
    const { SyncJob } = require('../src/models/SyncJob');
    syncJobCreateSpy = jest.spyOn(SyncJob, 'create').mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (syncJobCreateSpy) syncJobCreateSpy.mockRestore();
  });

  it('should rate limit and enqueue retry if limit exceeded', async () => {
    const { pushOrderToSupplier } = require('../src/services/dropship/outboundWebhook');
    rateLimiter.checkAndRecord.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfter: 500,
    });
    const result = await pushOrderToSupplier(mockOrder, mockSupplier);
    expect(result.status).toBe('rate_limited');
    expect(result.queuedForRetry).toBe(true);
    expect(retryQueue.enqueue).toHaveBeenCalledWith(
      mockSupplier.id,
      expect.objectContaining({ order: mockOrder, supplier: mockSupplier }),
      500,
    );
  });

  it('should process retry queue and push ready orders', async () => {
    const { processRetryQueue } = require('../src/services/dropship/outboundWebhook');
    retryQueue.getReadyRequests.mockResolvedValueOnce([
      { data: { order: mockOrder, supplier: mockSupplier } },
    ]);
    retryQueue.dequeue.mockResolvedValueOnce(true);
    rateLimiter.checkAndRecord.mockResolvedValue({ allowed: true });
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });
    const processed = await processRetryQueue(mockSupplier.id);
    expect(processed).toBe(1);
    expect(mockedAxios.post).toHaveBeenCalled();
    expect(retryQueue.dequeue).toHaveBeenCalled();
  });

  it('should skip processing if Redis not initialized', async () => {
    const { processRetryQueue } = require('../src/services/dropship/outboundWebhook');
    initializeRedis(null as any);
    const processed = await processRetryQueue(mockSupplier.id);
    expect(processed).toBe(0);
  });

  it('should keep in queue if still rate limited on retry', async () => {
    retryQueue.getReadyRequests.mockResolvedValueOnce([
      { data: { order: mockOrder, supplier: mockSupplier } },
    ]);
    jest.resetModules();
    jest.doMock('../src/services/dropship/outboundWebhook', () => ({
      ...jest.requireActual('../src/services/dropship/outboundWebhook'),
      pushOrderToSupplier: jest.fn().mockResolvedValue({ status: 'rate_limited' }),
    }));
    const { processRetryQueue } = require('../src/services/dropship/outboundWebhook');
    const processed = await processRetryQueue(mockSupplier.id);
    expect(processed).toBe(0);
    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(retryQueue.dequeue).not.toHaveBeenCalled();
  });

  it('should handle errors in retry processing gracefully', async () => {
    retryQueue.getReadyRequests.mockResolvedValueOnce([
      { data: { order: mockOrder, supplier: mockSupplier } },
    ]);
    jest.resetModules();
    jest.doMock('../src/services/dropship/outboundWebhook', () => ({
      ...jest.requireActual('../src/services/dropship/outboundWebhook'),
      pushOrderToSupplier: jest.fn().mockRejectedValue(new Error('Push failed')),
    }));
    const { processRetryQueue } = require('../src/services/dropship/outboundWebhook');
    const processed = await processRetryQueue(mockSupplier.id);
    expect(processed).toBe(0);
    expect(retryQueue.dequeue).not.toHaveBeenCalled();
  });
});
