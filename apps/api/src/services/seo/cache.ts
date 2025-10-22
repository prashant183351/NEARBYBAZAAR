/**
 * SEO Metadata Cache
 *
 * Redis-based caching layer for SEO metadata to reduce database queries
 * and improve response times for frequently accessed pages
 */

import Redis from 'ioredis';
import crypto from 'crypto';
import { SeoMetadata } from './generator';

export interface SeoCacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

/**
 * SEO Metadata Cache
 */
export class SeoMetadataCache {
  private redis: Redis;
  private ttl: number;
  private prefix: string;

  constructor(redis: Redis, options: SeoCacheOptions = {}) {
    this.redis = redis;
    this.ttl = options.ttl || 3600; // Default 1 hour
    this.prefix = options.prefix || 'seo:meta:';
  }

  /**
   * Get cached SEO metadata
   */
  async get(path: string, locale: string): Promise<SeoMetadata | null> {
    const key = this.getCacheKey(path, locale);

    try {
      const cached = await this.redis.get(key);
      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as SeoMetadata;
    } catch (error) {
      console.error('SEO cache get error:', error);
      return null; // Fail gracefully
    }
  }

  /**
   * Set SEO metadata in cache
   */
  async set(path: string, locale: string, metadata: SeoMetadata): Promise<void> {
    const key = this.getCacheKey(path, locale);

    try {
      await this.redis.setex(key, this.ttl, JSON.stringify(metadata));
    } catch (error) {
      console.error('SEO cache set error:', error);
      // Don't throw - caching is optional
    }
  }

  /**
   * Invalidate cache for a specific path
   */
  async invalidate(path: string, locale?: string): Promise<void> {
    try {
      if (locale) {
        // Invalidate specific locale
        const key = this.getCacheKey(path, locale);
        await this.redis.del(key);
      } else {
        // Invalidate all locales for this path
        const pattern = `${this.prefix}${this.hashPath(path)}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      console.error('SEO cache invalidate error:', error);
    }
  }

  /**
   * Invalidate cache by pattern (e.g., all product pages)
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.prefix}${pattern}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('SEO cache invalidate by pattern error:', error);
    }
  }

  /**
   * Generate ETag for metadata
   */
  generateETag(metadata: SeoMetadata): string {
    const content = JSON.stringify(metadata);
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Get cache key for path and locale
   */
  private getCacheKey(path: string, locale: string): string {
    const pathHash = this.hashPath(path);
    return `${this.prefix}${pathHash}:${locale}`;
  }

  /**
   * Hash path to create shorter cache keys
   */
  private hashPath(path: string): string {
    // Normalize path (remove query string, trailing slash)
    const normalized = path.split('?')[0].replace(/\/$/, '');

    // For common paths, use readable keys
    if (normalized === '' || normalized === '/') {
      return 'home';
    }
    if (normalized.startsWith('/p/')) {
      return `product:${normalized.replace('/p/', '')}`;
    }
    if (normalized.startsWith('/s/') || normalized.startsWith('/store/')) {
      return `store:${normalized.replace(/^\/(s|store)\//, '')}`;
    }
    if (normalized.startsWith('/c/')) {
      return `category:${normalized.replace('/c/', '')}`;
    }

    // For other paths, use hash
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; memory: number }> {
    try {
      const keys = await this.redis.keys(`${this.prefix}*`);
      const memory = await this.redis.memory('USAGE', `${this.prefix}*`);

      return {
        keys: keys.length,
        memory: memory || 0,
      };
    } catch (error) {
      console.error('SEO cache stats error:', error);
      return { keys: 0, memory: 0 };
    }
  }
}

// Singleton instance
let cacheInstance: SeoMetadataCache | null = null;

/**
 * Initialize SEO cache with Redis instance
 */
export function initializeSeoCache(redis: Redis, options?: SeoCacheOptions): SeoMetadataCache {
  cacheInstance = new SeoMetadataCache(redis, options);
  return cacheInstance;
}

/**
 * Get SEO cache instance
 */
export function getSeoCache(): SeoMetadataCache {
  if (!cacheInstance) {
    throw new Error('SEO cache not initialized. Call initializeSeoCache() first.');
  }
  return cacheInstance;
}

/**
 * Cache invalidation helpers for common scenarios
 */
export const SeoCacheInvalidation = {
  /**
   * Invalidate product page cache
   */
  async invalidateProduct(slug: string): Promise<void> {
    const cache = getSeoCache();
    await cache.invalidate(`/p/${slug}`);
  },

  /**
   * Invalidate store page cache
   */
  async invalidateStore(slug: string): Promise<void> {
    const cache = getSeoCache();
    await cache.invalidate(`/s/${slug}`);
    await cache.invalidate(`/store/${slug}`);
  },

  /**
   * Invalidate category page cache
   */
  async invalidateCategory(slug: string): Promise<void> {
    const cache = getSeoCache();
    await cache.invalidate(`/c/${slug}`);
  },

  /**
   * Invalidate all product pages
   */
  async invalidateAllProducts(): Promise<void> {
    const cache = getSeoCache();
    await cache.invalidateByPattern('product:*');
  },

  /**
   * Invalidate all store pages
   */
  async invalidateAllStores(): Promise<void> {
    const cache = getSeoCache();
    await cache.invalidateByPattern('store:*');
  },

  /**
   * Invalidate home page
   */
  async invalidateHome(): Promise<void> {
    const cache = getSeoCache();
    await cache.invalidate('/');
  },
};
