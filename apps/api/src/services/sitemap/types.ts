/**
 * Sitemap Types
 * Defines TypeScript interfaces for sitemap generation
 */

/**
 * Change frequency for sitemap entries
 */
export type ChangeFrequency =
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';

/**
 * Single URL entry in sitemap
 */
export interface SitemapUrl {
    /** Full URL including protocol and domain */
    loc: string;
    /** Last modification date (ISO 8601) */
    lastmod?: string;
    /** Change frequency hint for crawlers */
    changefreq?: ChangeFrequency;
    /** Priority (0.0 to 1.0) */
    priority?: number;
    /** Associated images for this URL */
    images?: SitemapImage[];
}

/**
 * Image entry for sitemap
 */
export interface SitemapImage {
    /** Image URL */
    loc: string;
    /** Image caption/description */
    caption?: string;
    /** Image title */
    title?: string;
    /** Geographic location of image */
    geoLocation?: string;
    /** License URL for image */
    license?: string;
}

/**
 * Sitemap configuration options
 */
export interface SitemapOptions {
    /** Base URL for the site (e.g., https://nearbybazaar.com) */
    baseUrl: string;
    /** Maximum URLs per sitemap file (default: 50000) */
    maxUrlsPerSitemap?: number;
    /** Whether to include images in sitemap */
    includeImages?: boolean;
    /** Default change frequency */
    defaultChangeFreq?: ChangeFrequency;
}

/**
 * Sitemap chunk for splitting large sitemaps
 */
export interface SitemapChunk {
    /** Chunk identifier (e.g., 'products-1', 'stores-1') */
    name: string;
    /** URLs in this chunk */
    urls: SitemapUrl[];
    /** Total number of chunks for this type */
    totalChunks: number;
    /** Current chunk number (1-based) */
    chunkNumber: number;
}

/**
 * Sitemap index entry
 */
export interface SitemapIndexEntry {
    /** URL to the sitemap file */
    loc: string;
    /** Last modification date of the sitemap */
    lastmod?: string;
}

/**
 * Entity types that can be included in sitemap
 */
export type SitemapEntityType = 'product' | 'service' | 'store' | 'classified' | 'static';

/**
 * Statistics about generated sitemaps
 */
export interface SitemapStats {
    /** Total number of URLs across all sitemaps */
    totalUrls: number;
    /** Number of sitemap files generated */
    totalSitemaps: number;
    /** Breakdown by entity type */
    byType: Record<SitemapEntityType | 'static', number>;
    /** Generation timestamp */
    generatedAt: Date;
}
