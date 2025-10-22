/**
 * SEO API Routes
 *
 * API endpoints for fetching SEO metadata for server-side rendering
 * and dynamic page generation
 */

import { Router, Request, Response } from 'express';
import { getSeoGenerator } from '../services/seo/generator';
import { getSeoCache, initializeSeoCache } from '../services/seo/cache';
import Redis from 'ioredis';

const router = Router();

// Initialize Redis for caching (if not already initialized)
let redis: Redis | null = null;

/**
 * Initialize SEO service with Redis
 */
export function initializeSeoService(redisInstance: Redis): void {
  redis = redisInstance;
  initializeSeoCache(redis, {
    ttl: 3600, // 1 hour default cache
  });
}

/**
 * GET /v1/seo
 *
 * Fetch SEO metadata for a given path
 *
 * Query Parameters:
 * - path: The route path (e.g., /p/product-slug, /s/store-slug)
 * - lang: Locale/language code (default: 'en')
 *
 * Headers:
 * - If-None-Match: ETag for conditional requests
 *
 * Response:
 * - 200: SEO metadata
 * - 304: Not Modified (if ETag matches)
 * - 400: Bad Request (missing path parameter)
 * - 500: Internal Server Error
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const path = req.query.path as string;
    const locale = (req.query.lang as string) || 'en';

    // Validate path parameter
    if (!path) {
      return res.status(400).json({
        error: 'Missing required parameter: path',
        example: '/v1/seo?path=/p/product-slug&lang=en',
      });
    }

    // Validate locale
    const supportedLocales = ['en', 'hi'];
    if (!supportedLocales.includes(locale)) {
      return res.status(400).json({
        error: 'Unsupported locale',
        supported: supportedLocales,
      });
    }

    // Try to get from cache first
    let metadata = null;
    let etag = '';

    if (redis) {
      try {
        const cache = getSeoCache();
        metadata = await cache.get(path, locale);

        if (metadata) {
          // Generate ETag from cached metadata
          etag = cache.generateETag(metadata);

          // Check If-None-Match header for conditional request
          const clientETag = req.headers['if-none-match'];
          if (clientETag === etag) {
            return res.status(304).end();
          }
        }
      } catch (error) {
        // Cache error - continue without cache
        console.error('SEO cache error:', error);
      }
    }

    // Generate metadata if not cached
    if (!metadata) {
      const generator = getSeoGenerator();
      metadata = await generator.generateMetadata(path, locale);

      // Cache the result
      if (redis) {
        try {
          const cache = getSeoCache();
          await cache.set(path, locale, metadata);
          etag = cache.generateETag(metadata);
        } catch (error) {
          console.error('SEO cache set error:', error);
        }
      }
    }

    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');

    if (etag) {
      res.setHeader('ETag', etag);
    }

    // Set Last-Modified if available
    if (metadata.modifiedTime) {
      res.setHeader('Last-Modified', new Date(metadata.modifiedTime).toUTCString());
    }

    // Set Vary header for locale-specific caching
    res.setHeader('Vary', 'Accept-Language');

    // Return metadata
    return res.status(200).json(metadata);
  } catch (error) {
    console.error('SEO API error:', error);
    return res.status(500).json({
      error: 'Failed to generate SEO metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /v1/seo/cache
 *
 * Invalidate SEO cache (admin only)
 *
 * Query Parameters:
 * - path: Specific path to invalidate (optional)
 * - pattern: Pattern to match (e.g., 'product:*') (optional)
 * - all: Invalidate all cache (optional)
 *
 * Response:
 * - 200: Cache invalidated
 * - 400: Bad Request
 * - 500: Internal Server Error
 */
router.delete('/cache', async (req: Request, res: Response) => {
  try {
    // TODO: Add authentication middleware to ensure admin-only access
    // if (!req.user || !req.user.isAdmin) {
    //     return res.status(403).json({ error: 'Forbidden' });
    // }

    if (!redis) {
      return res.status(400).json({
        error: 'Cache not initialized',
      });
    }

    const cache = getSeoCache();
    const path = req.query.path as string;
    const pattern = req.query.pattern as string;
    const all = req.query.all === 'true';

    if (all) {
      // Invalidate all cache
      await cache.invalidateByPattern('*');
      return res.status(200).json({
        message: 'All SEO cache invalidated',
      });
    }

    if (pattern) {
      // Invalidate by pattern
      await cache.invalidateByPattern(pattern);
      return res.status(200).json({
        message: `SEO cache invalidated for pattern: ${pattern}`,
      });
    }

    if (path) {
      // Invalidate specific path
      await cache.invalidate(path);
      return res.status(200).json({
        message: `SEO cache invalidated for path: ${path}`,
      });
    }

    return res.status(400).json({
      error: 'Missing parameter: path, pattern, or all',
    });
  } catch (error) {
    console.error('SEO cache invalidation error:', error);
    return res.status(500).json({
      error: 'Failed to invalidate cache',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /v1/seo/cache/stats
 *
 * Get cache statistics (admin only)
 *
 * Response:
 * - 200: Cache stats
 * - 500: Internal Server Error
 */
router.get('/cache/stats', async (_req: Request, res: Response) => {
  try {
    // TODO: Add authentication middleware

    if (!redis) {
      return res.status(200).json({
        enabled: false,
        keys: 0,
        memory: 0,
      });
    }

    const cache = getSeoCache();
    const stats = await cache.getStats();

    return res.status(200).json({
      enabled: true,
      ...stats,
    });
  } catch (error) {
    console.error('SEO cache stats error:', error);
    return res.status(500).json({
      error: 'Failed to get cache stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
