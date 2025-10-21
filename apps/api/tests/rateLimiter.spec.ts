/**
 * Rate Limiter Tests
 * 
 * Tests for supplier rate limiting and retry queue functionality
 */

import Redis from 'ioredis';
import { SupplierRateLimiter, RateLimitRetryQueue, DEFAULT_RATE_LIMITS } from '../src/services/dropship/rateLimiter';
import { pushOrderToSupplier, initializeRedis } from '../src/services/dropship/outboundWebhook';
import axios from 'axios';
import { SyncJob } from '../src/models/SyncJob';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Supplier Rate Limiter', () => {
    let redis: Redis;
    let rateLimiter: SupplierRateLimiter;

    beforeAll(() => {
        // Use Redis test instance or mock
        redis = new Redis({
            host: 'localhost',
            port: 6379,
            db: 15, // Use separate DB for tests
        });
    });

    beforeEach(async () => {
        // Clear all test keys
        const keys = await redis.keys('rate_limit:*');
        if (keys.length > 0) {
            await redis.del(...keys);
        }

        rateLimiter = new SupplierRateLimiter(redis, {
            maxRequests: 5,
            windowMs: 1000, // 5 requests per second for testing
        });
    });

    afterAll(async () => {
        await redis.quit();
    });

    describe('Basic Rate Limiting', () => {
        it('should allow requests within limit', async () => {
            const supplierId = 'supplier_test_1';

            // Make 5 requests (within limit)
            for (let i = 0; i < 5; i++) {
                const result = await rateLimiter.checkAndRecord(supplierId);
                expect(result.allowed).toBe(true);
                expect(result.remaining).toBe(4 - i);
            }
        });

        it('should block requests exceeding limit', async () => {
            const supplierId = 'supplier_test_2';

            // Make 5 requests (fill the limit)
            for (let i = 0; i < 5; i++) {
                await rateLimiter.checkAndRecord(supplierId);
            }

            // 6th request should be blocked
            const result = await rateLimiter.checkAndRecord(supplierId);
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
            expect(result.retryAfter).toBeDefined();
            expect(result.retryAfter).toBeGreaterThan(0);
        });

        it('should allow requests after window expires', async () => {
            const supplierId = 'supplier_test_3';

            // Fill the limit
            for (let i = 0; i < 5; i++) {
                await rateLimiter.checkAndRecord(supplierId);
            }

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Should allow new requests
            const result = await rateLimiter.checkAndRecord(supplierId);
            expect(result.allowed).toBe(true);
        });

        it('should use sliding window correctly', async () => {
            const supplierId = 'supplier_test_4';

            // Make 3 requests
            for (let i = 0; i < 3; i++) {
                await rateLimiter.checkAndRecord(supplierId);
            }

            // Wait 600ms (more than half the window)
            await new Promise(resolve => setTimeout(resolve, 600));

            // Make 2 more requests (total 5, at limit)
            await rateLimiter.checkAndRecord(supplierId);
            await rateLimiter.checkAndRecord(supplierId);

            // Next request should be blocked
            const blocked = await rateLimiter.checkAndRecord(supplierId);
            expect(blocked.allowed).toBe(false);

            // Wait for first 3 requests to expire (400ms more)
            await new Promise(resolve => setTimeout(resolve, 500));

            // Should allow 3 more requests now
            const result = await rateLimiter.checkAndRecord(supplierId);
            expect(result.allowed).toBe(true);
        });
    });

    describe('Multiple Suppliers (Fairness)', () => {
        it('should handle multiple suppliers independently', async () => {
            const supplier1 = 'supplier_fair_1';
            const supplier2 = 'supplier_fair_2';

            // Fill supplier1's limit
            for (let i = 0; i < 5; i++) {
                await rateLimiter.checkAndRecord(supplier1);
            }

            // Supplier1 should be blocked
            const blocked = await rateLimiter.checkAndRecord(supplier1);
            expect(blocked.allowed).toBe(false);

            // Supplier2 should still be allowed
            const allowed = await rateLimiter.checkAndRecord(supplier2);
            expect(allowed.allowed).toBe(true);
        });

        it('should not let slow supplier block others', async () => {
            const fastSupplier = 'supplier_fast';
            const slowSupplier = 'supplier_slow';

            // Simulate slow supplier hitting limit
            for (let i = 0; i < 5; i++) {
                await rateLimiter.checkAndRecord(slowSupplier);
            }

            // Fast supplier should still work normally
            for (let i = 0; i < 5; i++) {
                const result = await rateLimiter.checkAndRecord(fastSupplier);
                expect(result.allowed).toBe(true);
            }

            // Both suppliers maintain independent limits
            const slowBlocked = await rateLimiter.checkAndRecord(slowSupplier);
            const fastBlocked = await rateLimiter.checkAndRecord(fastSupplier);

            expect(slowBlocked.allowed).toBe(false);
            expect(fastBlocked.allowed).toBe(false);
        });

        it('should handle concurrent requests from multiple suppliers', async () => {
            const suppliers = ['s1', 's2', 's3', 's4', 's5'];

            // Simulate concurrent requests from all suppliers
            const promises = suppliers.map(supplierId =>
                rateLimiter.checkAndRecord(supplierId)
            );

            const results = await Promise.all(promises);

            // All should be allowed (first request for each)
            results.forEach(result => {
                expect(result.allowed).toBe(true);
            });
        });
    });

    describe('Rate Limit Status', () => {
        it('should get status without recording request', async () => {
            const supplierId = 'supplier_status_1';

            // Make 3 requests
            for (let i = 0; i < 3; i++) {
                await rateLimiter.checkAndRecord(supplierId);
            }

            // Get status without recording
            const status1 = await rateLimiter.getStatus(supplierId);
            expect(status1.remaining).toBe(2);

            // Get status again - should be same
            const status2 = await rateLimiter.getStatus(supplierId);
            expect(status2.remaining).toBe(2);

            // Actually record a request
            await rateLimiter.checkAndRecord(supplierId);

            // Now status should show one less
            const status3 = await rateLimiter.getStatus(supplierId);
            expect(status3.remaining).toBe(1);
        });
    });

    describe('Rate Limit Reset', () => {
        it('should reset rate limit for supplier', async () => {
            const supplierId = 'supplier_reset_1';

            // Fill the limit
            for (let i = 0; i < 5; i++) {
                await rateLimiter.checkAndRecord(supplierId);
            }

            // Should be blocked
            const blocked = await rateLimiter.checkAndRecord(supplierId);
            expect(blocked.allowed).toBe(false);

            // Reset the limit
            await rateLimiter.reset(supplierId);

            // Should be allowed again
            const result = await rateLimiter.checkAndRecord(supplierId);
            expect(result.allowed).toBe(true);
        });
    });

    describe('Configuration Tiers', () => {
        it('should support different rate limit tiers', () => {
            const defaultConfig = rateLimiter.getConfig('default');
            const conservativeConfig = rateLimiter.getConfig('conservative');
            const premiumConfig = rateLimiter.getConfig('premium');

            expect(defaultConfig.maxRequests).toBe(DEFAULT_RATE_LIMITS.default.maxRequests);
            expect(conservativeConfig.maxRequests).toBe(DEFAULT_RATE_LIMITS.conservative.maxRequests);
            expect(premiumConfig.maxRequests).toBe(DEFAULT_RATE_LIMITS.premium.maxRequests);

            // Premium should have higher limit
            expect(premiumConfig.maxRequests).toBeGreaterThan(defaultConfig.maxRequests);
            expect(defaultConfig.maxRequests).toBeGreaterThan(conservativeConfig.maxRequests);
        });

        it('should apply custom config per supplier', async () => {
            const supplierId = 'supplier_custom';
            const customConfig = { maxRequests: 3, windowMs: 1000 };

            // Make 3 requests (custom limit)
            for (let i = 0; i < 3; i++) {
                const result = await rateLimiter.checkAndRecord(supplierId, customConfig);
                expect(result.allowed).toBe(true);
            }

            // 4th request should be blocked
            const blocked = await rateLimiter.checkAndRecord(supplierId, customConfig);
            expect(blocked.allowed).toBe(false);
        });
    });
});

describe('Retry Queue', () => {
    let redis: Redis;
    let retryQueue: RateLimitRetryQueue;

    beforeAll(() => {
        redis = new Redis({
            host: 'localhost',
            port: 6379,
            db: 15,
        });
    });

    beforeEach(async () => {
        // Clear all queue keys
        const keys = await redis.keys('retry_queue:*');
        if (keys.length > 0) {
            await redis.del(...keys);
        }

        retryQueue = new RateLimitRetryQueue(redis);
    });

    afterAll(async () => {
        await redis.quit();
    });

    describe('Enqueue/Dequeue', () => {
        it('should enqueue rate-limited request', async () => {
            const supplierId = 'supplier_queue_1';
            const requestData = { orderId: 'ORD-123', items: [] };

            await retryQueue.enqueue(supplierId, requestData, 1000);

            const length = await retryQueue.getQueueLength(supplierId);
            expect(length).toBe(1);
        });

        it('should retrieve ready requests', async () => {
            const supplierId = 'supplier_queue_2';
            const requestData = { orderId: 'ORD-456', items: [] };

            // Enqueue with 0 delay (ready immediately)
            await retryQueue.enqueue(supplierId, requestData, 0);

            // Wait a bit to ensure it's ready
            await new Promise(resolve => setTimeout(resolve, 10));

            const readyRequests = await retryQueue.getReadyRequests(supplierId);
            expect(readyRequests.length).toBe(1);
            expect(readyRequests[0].data).toEqual(requestData);
        });

        it('should not retrieve requests not yet ready', async () => {
            const supplierId = 'supplier_queue_3';
            const requestData = { orderId: 'ORD-789', items: [] };

            // Enqueue with 2 second delay
            await retryQueue.enqueue(supplierId, requestData, 2000);

            // Try to get immediately
            const readyRequests = await retryQueue.getReadyRequests(supplierId);
            expect(readyRequests.length).toBe(0);

            // Wait for it to be ready
            await new Promise(resolve => setTimeout(resolve, 2100));

            const readyNow = await retryQueue.getReadyRequests(supplierId);
            expect(readyNow.length).toBe(1);
        });

        it('should handle multiple queued requests', async () => {
            const supplierId = 'supplier_queue_4';

            // Enqueue 3 requests with different delays
            await retryQueue.enqueue(supplierId, { orderId: 'ORD-1' }, 0);
            await retryQueue.enqueue(supplierId, { orderId: 'ORD-2' }, 100);
            await retryQueue.enqueue(supplierId, { orderId: 'ORD-3' }, 200);

            const length = await retryQueue.getQueueLength(supplierId);
            expect(length).toBe(3);

            // Wait and get ready ones
            await new Promise(resolve => setTimeout(resolve, 250));

            const ready = await retryQueue.getReadyRequests(supplierId);
            expect(ready.length).toBe(3);
        });

        it('should limit retrieved requests', async () => {
            const supplierId = 'supplier_queue_5';

            // Enqueue 10 requests
            for (let i = 0; i < 10; i++) {
                await retryQueue.enqueue(supplierId, { orderId: `ORD-${i}` }, 0);
            }

            await new Promise(resolve => setTimeout(resolve, 10));

            // Retrieve with limit of 5
            const ready = await retryQueue.getReadyRequests(supplierId, 5);
            expect(ready.length).toBe(5);
        });
    });

    describe('Clear Queue', () => {
        it('should clear all queued requests', async () => {
            const supplierId = 'supplier_clear';

            // Enqueue several requests
            for (let i = 0; i < 5; i++) {
                await retryQueue.enqueue(supplierId, { orderId: `ORD-${i}` }, 1000);
            }

            let length = await retryQueue.getQueueLength(supplierId);
            expect(length).toBe(5);

            // Clear the queue
            await retryQueue.clear(supplierId);

            length = await retryQueue.getQueueLength(supplierId);
            expect(length).toBe(0);
        });
    });
});

describe('Integration: Rate Limiter + Order Push', () => {
    let redis: Redis;

    beforeAll(async () => {
        redis = new Redis({
            host: 'localhost',
            port: 6379,
            db: 15,
        });
        initializeRedis(redis);

        // Clear test data
        await SyncJob.deleteMany({});
    });

    beforeEach(async () => {
        // Clear Redis keys
        const keys = await redis.keys('rate_limit:*');
        if (keys.length > 0) {
            await redis.del(...keys);
        }

        mockedAxios.post.mockClear();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should push order successfully when under rate limit', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            status: 200,
            data: { orderId: 'SUP-ORD-123', status: 'accepted' },
        });

        const order = { id: 'ORD-RATE-1', items: [], customer: {} };
        const supplier = {
            id: 'supplier_integration_1',
            companyName: 'Test Supplier',
            orderApiUrl: 'https://api.supplier.com/orders',
            rateLimitTier: 'default',
        };

        const result = await pushOrderToSupplier(order, supplier);

        expect(result.status).toBe('success');
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should queue order when rate limit exceeded', async () => {
        const supplierId = 'supplier_integration_2';
        const supplier = {
            id: supplierId,
            companyName: 'Rate Limited Supplier',
            orderApiUrl: 'https://api.supplier.com/orders',
            rateLimitTier: 'conservative', // Lower limit
        };

        // Create rate limiter with low limit for testing
        const rateLimiter = new SupplierRateLimiter(redis, {
            maxRequests: 2,
            windowMs: 60000,
        });

        // Fill the limit
        await rateLimiter.checkAndRecord(supplierId);
        await rateLimiter.checkAndRecord(supplierId);

        // Next push should be rate limited
        const order = { id: 'ORD-RATE-2', items: [], customer: {} };
        const result = await pushOrderToSupplier(order, supplier);

        expect(result.status).toBe('rate_limited');
        expect(result.queuedForRetry).toBe(true);
        expect(result.retryAfter).toBeDefined();

        // Should not have called supplier API
        expect(mockedAxios.post).not.toHaveBeenCalled();

        // Should have logged warning in SyncJob
        const jobs = await SyncJob.find({ jobType: 'order-push', status: 'failed' });
        expect(jobs.length).toBeGreaterThan(0);
        expect(jobs[0].error).toContain('Rate limit exceeded');
    });

    it('should maintain fairness across multiple suppliers', async () => {
        mockedAxios.post.mockResolvedValue({
            status: 200,
            data: { status: 'accepted' },
        });

        const suppliers = [
            { id: 's1', orderApiUrl: 'https://api1.com', rateLimitTier: 'default' },
            { id: 's2', orderApiUrl: 'https://api2.com', rateLimitTier: 'default' },
            { id: 's3', orderApiUrl: 'https://api3.com', rateLimitTier: 'default' },
        ];

        // Push orders to all suppliers concurrently
        const promises = suppliers.map((supplier, i) =>
            pushOrderToSupplier(
                { id: `ORD-${i}`, items: [], customer: {} },
                supplier
            )
        );

        const results = await Promise.all(promises);

        // All should succeed (fairness - one doesn't block others)
        results.forEach(result => {
            expect(['success', 'rate_limited']).toContain(result.status);
        });
    });
});
