/**
 * Sitemap Generator Service
 * Generates XML sitemaps for products, services, stores, and classifieds
 */

import { Product } from '../../models/Product';
import { Service } from '../../models/Service';
import { Vendor } from '../../models/Vendor';
import { Classified } from '../../models/Classified';
import {
  SitemapUrl,
  SitemapOptions,
  SitemapChunk,
  SitemapIndexEntry,
  SitemapEntityType,
  SitemapStats,
  ChangeFrequency,
  SitemapImage,
} from './types';

/**
 * Default sitemap configuration
 */
const DEFAULT_OPTIONS: Required<SitemapOptions> = {
  baseUrl: process.env.BASE_URL || 'https://nearbybazaar.com',
  maxUrlsPerSitemap: 50000,
  includeImages: true,
  defaultChangeFreq: 'weekly',
};

/**
 * Static pages to include in sitemap
 */
const STATIC_PAGES: Array<{
  path: string;
  priority: number;
  changefreq: ChangeFrequency;
}> = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/search', priority: 0.8, changefreq: 'daily' },
  { path: '/changelog', priority: 0.5, changefreq: 'weekly' },
];

/**
 * SitemapGenerator - Generates XML sitemaps for the platform
 */
export class SitemapGenerator {
  private options: Required<SitemapOptions>;

  constructor(options?: Partial<SitemapOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Generate sitemap index (main sitemap that links to all other sitemaps)
   */
  async generateIndex(): Promise<SitemapIndexEntry[]> {
    const entries: SitemapIndexEntry[] = [];
    const now = new Date().toISOString();

    // Count entities to determine number of chunks needed
    const [productCount, serviceCount, storeCount, classifiedCount] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Service.countDocuments({ isActive: true }),
      Vendor.countDocuments({ isActive: true }),
      Classified.countDocuments({ status: 'active' }),
    ]);

    // Add static pages sitemap
    entries.push({
      loc: `${this.options.baseUrl}/sitemap-static.xml`,
      lastmod: now,
    });

    // Add product sitemaps
    const productChunks = Math.ceil(productCount / this.options.maxUrlsPerSitemap);
    for (let i = 1; i <= productChunks; i++) {
      entries.push({
        loc: `${this.options.baseUrl}/sitemap-products-${i}.xml`,
        lastmod: now,
      });
    }

    // Add service sitemaps
    const serviceChunks = Math.ceil(serviceCount / this.options.maxUrlsPerSitemap);
    for (let i = 1; i <= serviceChunks; i++) {
      entries.push({
        loc: `${this.options.baseUrl}/sitemap-services-${i}.xml`,
        lastmod: now,
      });
    }

    // Add store sitemaps
    const storeChunks = Math.ceil(storeCount / this.options.maxUrlsPerSitemap);
    for (let i = 1; i <= storeChunks; i++) {
      entries.push({
        loc: `${this.options.baseUrl}/sitemap-stores-${i}.xml`,
        lastmod: now,
      });
    }

    // Add classified sitemaps
    const classifiedChunks = Math.ceil(classifiedCount / this.options.maxUrlsPerSitemap);
    for (let i = 1; i <= classifiedChunks; i++) {
      entries.push({
        loc: `${this.options.baseUrl}/sitemap-classifieds-${i}.xml`,
        lastmod: now,
      });
    }

    return entries;
  }

  /**
   * Generate static pages sitemap
   */
  async generateStaticSitemap(): Promise<SitemapUrl[]> {
    return STATIC_PAGES.map((page) => ({
      loc: `${this.options.baseUrl}${page.path}`,
      changefreq: page.changefreq,
      priority: page.priority,
      lastmod: new Date().toISOString(),
    }));
  }

  /**
   * Generate product sitemap chunk
   */
  async generateProductSitemap(chunkNumber: number = 1): Promise<SitemapChunk> {
    const skip = (chunkNumber - 1) * this.options.maxUrlsPerSitemap;
    const limit = this.options.maxUrlsPerSitemap;

    const [products, totalCount] = await Promise.all([
      Product.find({ isActive: true })
        .select('slug updatedAt name images')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments({ isActive: true }),
    ]);

    const urls: SitemapUrl[] = products.map((product: any) => {
      const url: SitemapUrl = {
        loc: `${this.options.baseUrl}/p/${product.slug}`,
        lastmod: product.updatedAt?.toISOString?.() || new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      };

      // Add images if enabled and available
      if (this.options.includeImages && product.images && Array.isArray(product.images)) {
        url.images = product.images.slice(0, 5).map((img: any) => {
          const image: SitemapImage = {
            loc: img.url || img,
            title: product.name,
          };
          if (img.alt) image.caption = img.alt;
          return image;
        });
      }

      return url;
    });

    const totalChunks = Math.ceil(totalCount / this.options.maxUrlsPerSitemap);

    return {
      name: `products-${chunkNumber}`,
      urls,
      totalChunks,
      chunkNumber,
    };
  }

  /**
   * Generate service sitemap chunk
   */
  async generateServiceSitemap(chunkNumber: number = 1): Promise<SitemapChunk> {
    const skip = (chunkNumber - 1) * this.options.maxUrlsPerSitemap;
    const limit = this.options.maxUrlsPerSitemap;

    const [services, totalCount] = await Promise.all([
      Service.find({ isActive: true })
        .select('slug updatedAt name images')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Service.countDocuments({ isActive: true }),
    ]);

    const urls: SitemapUrl[] = services.map((service: any) => {
      const url: SitemapUrl = {
        loc: `${this.options.baseUrl}/s/${service.slug}`,
        lastmod: service.updatedAt?.toISOString?.() || new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      };

      // Add images if enabled and available
      if (this.options.includeImages && service.images && Array.isArray(service.images)) {
        url.images = service.images.slice(0, 5).map((img: any) => {
          const image: SitemapImage = {
            loc: img.url || img,
            title: service.name,
          };
          if (img.alt) image.caption = img.alt;
          return image;
        });
      }

      return url;
    });

    const totalChunks = Math.ceil(totalCount / this.options.maxUrlsPerSitemap);

    return {
      name: `services-${chunkNumber}`,
      urls,
      totalChunks,
      chunkNumber,
    };
  }

  /**
   * Generate store sitemap chunk
   */
  async generateStoreSitemap(chunkNumber: number = 1): Promise<SitemapChunk> {
    const skip = (chunkNumber - 1) * this.options.maxUrlsPerSitemap;
    const limit = this.options.maxUrlsPerSitemap;

    const [vendors, totalCount] = await Promise.all([
      Vendor.find({ isActive: true })
        .select('slug updatedAt businessName logo')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vendor.countDocuments({ isActive: true }),
    ]);

    const urls: SitemapUrl[] = vendors.map((vendor: any) => {
      const url: SitemapUrl = {
        loc: `${this.options.baseUrl}/store/${vendor.slug}`,
        lastmod: vendor.updatedAt?.toISOString?.() || new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.7,
      };

      // Add logo as image if available
      if (this.options.includeImages && vendor.logo) {
        url.images = [
          {
            loc: typeof vendor.logo === 'string' ? vendor.logo : vendor.logo.url,
            title: vendor.businessName || 'Store Logo',
            caption: `Logo for ${vendor.businessName || 'store'}`,
          },
        ];
      }

      return url;
    });

    const totalChunks = Math.ceil(totalCount / this.options.maxUrlsPerSitemap);

    return {
      name: `stores-${chunkNumber}`,
      urls,
      totalChunks,
      chunkNumber,
    };
  }

  /**
   * Generate classified sitemap chunk
   */
  async generateClassifiedSitemap(chunkNumber: number = 1): Promise<SitemapChunk> {
    const skip = (chunkNumber - 1) * this.options.maxUrlsPerSitemap;
    const limit = this.options.maxUrlsPerSitemap;

    const [classifieds, totalCount] = await Promise.all([
      Classified.find({ status: 'active' })
        .select('slug updatedAt title images')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Classified.countDocuments({ status: 'active' }),
    ]);

    const urls: SitemapUrl[] = classifieds.map((classified: any) => {
      const url: SitemapUrl = {
        loc: `${this.options.baseUrl}/c/${classified.slug}`,
        lastmod: classified.updatedAt?.toISOString?.() || new Date().toISOString(),
        changefreq: 'daily',
        priority: 0.6,
      };

      // Add images if enabled and available
      if (this.options.includeImages && classified.images && Array.isArray(classified.images)) {
        url.images = classified.images.slice(0, 5).map((img: any) => {
          const image: SitemapImage = {
            loc: img.url || img,
            title: classified.title,
          };
          if (img.alt) image.caption = img.alt;
          return image;
        });
      }

      return url;
    });

    const totalChunks = Math.ceil(totalCount / this.options.maxUrlsPerSitemap);

    return {
      name: `classifieds-${chunkNumber}`,
      urls,
      totalChunks,
      chunkNumber,
    };
  }

  /**
   * Generate sitemap by type and chunk
   */
  async generateSitemap(
    type: SitemapEntityType | 'static',
    chunkNumber: number = 1,
  ): Promise<SitemapChunk | SitemapUrl[]> {
    switch (type) {
      case 'static':
        return this.generateStaticSitemap();
      case 'product':
        return this.generateProductSitemap(chunkNumber);
      case 'service':
        return this.generateServiceSitemap(chunkNumber);
      case 'store':
        return this.generateStoreSitemap(chunkNumber);
      case 'classified':
        return this.generateClassifiedSitemap(chunkNumber);
      default:
        throw new Error(`Unknown sitemap type: ${type}`);
    }
  }

  /**
   * Get statistics about all sitemaps
   */
  async getStats(): Promise<SitemapStats> {
    const [productCount, serviceCount, storeCount, classifiedCount] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Service.countDocuments({ isActive: true }),
      Vendor.countDocuments({ isActive: true }),
      Classified.countDocuments({ status: 'active' }),
    ]);

    const staticCount = STATIC_PAGES.length;
    const totalUrls = productCount + serviceCount + storeCount + classifiedCount + staticCount;

    const productChunks = Math.ceil(productCount / this.options.maxUrlsPerSitemap);
    const serviceChunks = Math.ceil(serviceCount / this.options.maxUrlsPerSitemap);
    const storeChunks = Math.ceil(storeCount / this.options.maxUrlsPerSitemap);
    const classifiedChunks = Math.ceil(classifiedCount / this.options.maxUrlsPerSitemap);
    const totalSitemaps = 1 + productChunks + serviceChunks + storeChunks + classifiedChunks; // +1 for static

    return {
      totalUrls,
      totalSitemaps,
      byType: {
        static: staticCount,
        product: productCount,
        service: serviceCount,
        store: storeCount,
        classified: classifiedCount,
      },
      generatedAt: new Date(),
    };
  }
}

// Singleton instance
let sitemapGeneratorInstance: SitemapGenerator | null = null;

/**
 * Get or create sitemap generator instance
 */
export function getSitemapGenerator(options?: Partial<SitemapOptions>): SitemapGenerator {
  if (!sitemapGeneratorInstance) {
    sitemapGeneratorInstance = new SitemapGenerator(options);
  }
  return sitemapGeneratorInstance;
}

/**
 * Reset singleton (useful for testing)
 */
export function resetSitemapGenerator(): void {
  sitemapGeneratorInstance = null;
}
