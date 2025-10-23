import axios from 'axios';
import { SyncJob } from '../../models/SyncJob';
import { getRateLimiter, getRetryQueue } from './rateLimiter';
import Redis from 'ioredis';

// import global idempotency system (stub)
export const idempotencyCache = new Set<string>();

// Redis instance for rate limiting (in production, use shared instance)
let redisInstance: Redis | null = null;

/**
 * Initialize Redis for rate limiting
 */
export function initializeRedis(redis: Redis) {
  redisInstance = redis;
}

/**
 * Push order to supplier with rate limiting
 */
export async function pushOrderToSupplier(order: any, supplier: any) {
  const idempotencyKey = `order:${order.id}:supplier:${supplier.id}`;
  if (idempotencyCache.has(idempotencyKey)) {
    // Already pushed, skip
    return { status: 'duplicate' };
  }

  // Check rate limit before proceeding
  if (redisInstance) {
    const rateLimiter = getRateLimiter(redisInstance);
    const retryQueue = getRetryQueue(redisInstance);

    // Get supplier's rate limit tier (could come from database)
    const supplierTier = supplier.rateLimitTier || 'default';
    const config = rateLimiter.getConfig(supplierTier);

    const rateLimit = await rateLimiter.checkAndRecord(supplier.id, config);

    if (!rateLimit.allowed) {
      console.warn(
        `⚠️  Rate limit exceeded for supplier ${supplier.id} (${supplier.companyName || 'Unknown'}). ` +
          `Remaining: ${rateLimit.remaining}. Retry after: ${rateLimit.retryAfter}ms`,
      );

      // Add to retry queue
      await retryQueue.enqueue(
        supplier.id,
        { order, supplier, idempotencyKey },
        rateLimit.retryAfter || 1000,
      );

      // Log warning in SyncJob
      await SyncJob.create({
        vendorId: supplier.id,
        jobType: 'order-push',
        status: 'failed',
        startedAt: new Date(),
        completedAt: new Date(),
        error: `Rate limit exceeded. Queued for retry in ${rateLimit.retryAfter}ms`,
      });

      return {
        status: 'rate_limited',
        retryAfter: rateLimit.retryAfter,
        queuedForRetry: true,
      };
    }
  }

  idempotencyCache.add(idempotencyKey);

  // Prepare payload for supplier
  const payload = {
    orderId: order.id,
    items: order.items,
    customer: order.customer,
    total: order.total,
    // ...other fields as needed
  };

  let response, error;
  try {
    response = await axios.post(supplier.orderApiUrl, payload, {
      headers: { 'X-Idempotency-Key': idempotencyKey },
      timeout: 10000,
    });
  } catch (err: any) {
    error = err.message || 'Unknown error';
  }

  // Audit log
  await SyncJob.create({
    vendorId: supplier.id,
    jobType: 'order-push',
    status: error ? 'failed' : 'success',
    startedAt: new Date(),
    completedAt: new Date(),
    error,
  });

  return { status: error ? 'failed' : 'success', response };
}

/**
 * Process retry queue for a supplier
 * Should be called periodically (e.g., via cron job or scheduler)
 */
export async function processRetryQueue(supplierId: string): Promise<number> {
  if (!redisInstance) {
    console.warn('Redis not initialized. Cannot process retry queue.');
    return 0;
  }

  const retryQueue = getRetryQueue(redisInstance);
  const readyRequests = await retryQueue.getReadyRequests(supplierId, 10);

  let processedCount = 0;

  for (const item of readyRequests) {
    const { data } = item;
    const { order, supplier } = data;

    try {
      // Remove idempotency check for retries (already verified)
      const result = await pushOrderToSupplier(order, supplier);

      if (result.status === 'success' || result.status === 'duplicate') {
        // Remove from queue on success
        await retryQueue.dequeue(supplierId, JSON.stringify(item));
        processedCount++;
        console.log(`✓ Retry successful for order ${order.id} to supplier ${supplierId}`);
      } else if (result.status === 'rate_limited') {
        // Still rate limited, will retry later
        console.log(`→ Order ${order.id} still rate limited, keeping in queue`);
      }
    } catch (error) {
      console.error(`✗ Retry failed for order ${order.id}:`, error);
      // Keep in queue for next retry
    }
  }

  return processedCount;
}

// Usage: call pushOrderToSupplier when a dropship order is created
// Test: simulate duplicate calls and verify only one push per order/supplier
