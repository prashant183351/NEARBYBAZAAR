/**
 * Dynamic Sitemap Route Handler
 * Handles all sitemap requests: sitemap-{type}-{chunk}.xml
 * Examples:
 * - /sitemap-static.xml
 * - /sitemap-products-1.xml
 * - /sitemap-services-2.xml
 */

import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Parse sitemap filename to extract type and chunk number
 */
function parseSitemapParams(filename: string): { type: string; chunk: number } | null {
  // Match patterns like: sitemap-static.xml, sitemap-products-1.xml
  const match = filename.match(/^sitemap-(\w+)(?:-(\d+))?\.xml$/);

  if (!match) {
    return null;
  }

  const type = match[1];
  const chunk = match[2] ? parseInt(match[2], 10) : 1;

  return { type, chunk };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the filename from query params
    const { filename } = req.query;

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Invalid sitemap request' });
    }

    const params = parseSitemapParams(filename);

    if (!params) {
      return res.status(404).json({ error: 'Sitemap not found' });
    }

    const { type, chunk } = params;

    // Validate type
    const validTypes = ['static', 'products', 'services', 'stores', 'classifieds'];
    if (!validTypes.includes(type)) {
      return res.status(404).json({ error: 'Invalid sitemap type' });
    }

    // Fetch sitemap from API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/v1/sitemap/${type}/${chunk}`);

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Sitemap not found' });
      }
      throw new Error(`API returned ${response.status}`);
    }

    const xml = await response.text();

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400',
    );

    // Support gzip if client accepts it
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (acceptEncoding.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
    }

    return res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
