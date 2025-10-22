/**
 * Sitemap API Routes
 * Provides endpoints for sitemap generation
 */

import { Router, Request, Response } from 'express';
import { getSitemapGenerator } from '../services/sitemap/generator';
import { formatSitemapXml, formatSitemapIndexXml } from '../services/sitemap/formatter';
import { SitemapChunk, SitemapUrl } from '../services/sitemap/types';

const router = Router();

/**
 * GET /v1/sitemap/index
 * Returns the sitemap index (main sitemap linking to all others)
 */
router.get('/index', async (_req: Request, res: Response) => {
  try {
    const generator = getSitemapGenerator();
    const entries = await generator.generateIndex();
    const xml = formatSitemapIndexXml(entries);

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400');

    return res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    return res.status(500).json({ error: 'Failed to generate sitemap index' });
  }
});

/**
 * GET /v1/sitemap/:type/:chunk
 * Returns a specific sitemap chunk
 *
 * @param type - Sitemap type (static, products, services, stores, classifieds)
 * @param chunk - Chunk number (1-based)
 */
router.get('/:type/:chunk?', async (req: Request, res: Response) => {
  try {
    const { type, chunk } = req.params;
    const chunkNumber = chunk ? parseInt(chunk, 10) : 1;

    // Validate type
    const validTypes = ['static', 'product', 'service', 'store', 'classified'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid sitemap type' });
    }

    // Validate chunk number
    if (isNaN(chunkNumber) || chunkNumber < 1) {
      return res.status(400).json({ error: 'Invalid chunk number' });
    }

    const generator = getSitemapGenerator();
    const result = await generator.generateSitemap(type as any, chunkNumber);

    let urls: SitemapUrl[];

    // Handle different return types
    if (Array.isArray(result)) {
      // Static sitemap returns array directly
      urls = result;
    } else {
      // Chunked sitemaps return SitemapChunk
      const chunk = result as SitemapChunk;

      // Check if chunk number is valid
      if (chunkNumber > chunk.totalChunks) {
        return res.status(404).json({ error: 'Chunk not found' });
      }

      urls = chunk.urls;
    }

    const xml = formatSitemapXml(urls);

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400');

    return res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return res.status(500).json({ error: 'Failed to generate sitemap' });
  }
});

/**
 * GET /v1/sitemap/stats
 * Returns statistics about all sitemaps
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const generator = getSitemapGenerator();
    const stats = await generator.getStats();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting sitemap stats:', error);
    return res.status(500).json({ error: 'Failed to get sitemap statistics' });
  }
});

export default router;
