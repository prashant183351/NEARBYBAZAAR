/**
 * SEO API Tests
 *
 * Tests for SEO metadata generation, caching, and API endpoints
 */

import Redis from 'ioredis';
import { SeoGenerator, parseRoute } from '../src/services/seo/generator';
import { SeoMetadataCache, initializeSeoCache } from '../src/services/seo/cache';
import { Product } from '../src/models/Product';
import { Vendor } from '../src/models/Vendor';

describe('SEO Route Parser', () => {
  describe('parseRoute', () => {
    it('should parse product routes', () => {
      const result = parseRoute('/p/cool-gadget');
      expect(result.type).toBe('product');
      expect(result.params.slug).toBe('cool-gadget');
    });

    it('should parse store routes with /s/', () => {
      const result = parseRoute('/s/awesome-store');
      expect(result.type).toBe('store');
      expect(result.params.slug).toBe('awesome-store');
    });

    it('should parse store routes with /store/', () => {
      const result = parseRoute('/store/awesome-store');
      expect(result.type).toBe('store');
      expect(result.params.slug).toBe('awesome-store');
    });

    it('should parse category routes', () => {
      const result = parseRoute('/c/electronics');
      expect(result.type).toBe('category');
      expect(result.params.slug).toBe('electronics');
    });

    it('should parse search route', () => {
      const result = parseRoute('/search');
      expect(result.type).toBe('search');
    });

    it('should parse home route', () => {
      const result = parseRoute('/');
      expect(result.type).toBe('home');
    });

    it('should parse static routes', () => {
      const result = parseRoute('/about');
      expect(result.type).toBe('static');
      expect(result.params.path).toBe('/about');
    });

    it('should handle query strings', () => {
      const result = parseRoute('/p/product?lang=hi');
      expect(result.type).toBe('product');
      expect(result.params.slug).toBe('product');
    });
  });
});

describe('SEO Generator', () => {
  let generator: SeoGenerator;

  beforeAll(async () => {
    generator = new SeoGenerator({
      baseUrl: 'https://test.com',
      siteName: 'TestSite',
      defaultImage: 'https://test.com/default.jpg',
      supportedLocales: ['en', 'hi'],
    });

    // Clear test data
    await Product.deleteMany({});
    await Vendor.deleteMany({});
  });

  describe('Product SEO', () => {
    it('should generate SEO for existing product', async () => {
      // Create test vendor
      const vendor = await Vendor.create({
        email: 'test@test.com',
        name: 'Test Vendor',
        owner: '507f1f77bcf86cd799439011',
        slug: 'test-vendor',
      });

      // Create test product
      await Product.create({
        name: 'Cool Gadget',
        description: 'An amazing gadget that does cool things',
        vendor: vendor._id,
        price: 99.99,
        currency: 'USD',
        category: 'electronics',
        slug: 'cool-gadget',
        sku: 'TEST-001',
      });

      const metadata = await generator.generateMetadata('/p/cool-gadget', 'en');

      expect(metadata.title).toContain('Cool Gadget');
      expect(metadata.description).toContain('amazing gadget');
      expect(metadata.canonical).toBe('https://test.com/p/cool-gadget');
      expect(metadata.ogType).toBe('product');
      expect(metadata.structuredData).toBeDefined();
      expect(metadata.structuredData?.['@type']).toBe('Product');
      expect(metadata.robots).toBe('index, follow');
      expect(metadata.locale).toBe('en');
    });

    it('should generate 404 SEO for non-existent product', async () => {
      const metadata = await generator.generateMetadata('/p/non-existent', 'en');

      expect(metadata.title).toContain('Not Found');
      expect(metadata.robots).toBe('noindex, nofollow');
    });

    it('should include alternate locales', async () => {
      const vendor = await Vendor.create({
        email: 'test2@test.com',
        name: 'Test Vendor 2',
        owner: '507f1f77bcf86cd799439012',
        slug: 'test-vendor-2',
      });

      await Product.create({
        name: 'Product 2',
        description: 'Product description',
        vendor: vendor._id,
        price: 49.99,
        slug: 'product-2',
        sku: 'TEST-002',
      });

      const metadata = await generator.generateMetadata('/p/product-2', 'en');

      expect(metadata.alternateLocales).toBeDefined();
      expect(metadata.alternateLocales?.length).toBeGreaterThan(0);
      expect(metadata.alternateLocales?.[0].locale).toBe('hi');
    });
  });

  describe('Store SEO', () => {
    it('should generate SEO for store page', async () => {
      await Vendor.create({
        email: 'store@test.com',
        name: 'Awesome Store',
        owner: '507f1f77bcf86cd799439013',
        slug: 'awesome-store',
      });

      const metadata = await generator.generateMetadata('/s/awesome-store', 'en');

      expect(metadata.title).toContain('Awesome Store');
      expect(metadata.canonical).toBe('https://test.com/s/awesome-store');
      expect(metadata.ogType).toBe('website');
      expect(metadata.structuredData).toBeDefined();
      expect(metadata.structuredData?.['@type']).toBe('Store');
    });
  });

  describe('Category SEO', () => {
    it('should generate SEO for category page', async () => {
      const metadata = await generator.generateMetadata('/c/electronics', 'en');

      expect(metadata.title).toContain('Electronics');
      expect(metadata.canonical).toBe('https://test.com/c/electronics');
      expect(metadata.structuredData?.['@type']).toBe('CollectionPage');
    });

    it('should handle multi-word categories', async () => {
      const metadata = await generator.generateMetadata('/c/home-appliances', 'en');

      expect(metadata.title).toContain('Home Appliances');
    });
  });

  describe('Home SEO', () => {
    it('should generate SEO for home page', async () => {
      const metadata = await generator.generateMetadata('/', 'en');

      expect(metadata.title).toContain('TestSite');
      expect(metadata.canonical).toBe('https://test.com/');
      expect(metadata.structuredData?.['@type']).toBe('WebSite');
      expect(metadata.structuredData?.potentialAction).toBeDefined();
    });
  });

  describe('Search SEO', () => {
    it('should generate SEO for search page', async () => {
      const metadata = await generator.generateMetadata('/search', 'en');

      expect(metadata.title).toContain('Search');
      expect(metadata.robots).toBe('noindex, follow');
    });
  });

  describe('Localization', () => {
    it('should generate metadata for Hindi locale', async () => {
      const metadata = await generator.generateMetadata('/', 'hi');

      expect(metadata.locale).toBe('hi');
      expect(metadata.ogLocale).toBe('hi_IN');
    });
  });
});

describe('SEO Cache', () => {
  let redis: Redis;
  let cache: SeoMetadataCache;

  beforeAll(() => {
    redis = new Redis({
      host: 'localhost',
      port: 6379,
      db: 15, // Use separate DB for tests
    });

    cache = initializeSeoCache(redis, {
      ttl: 60, // Short TTL for tests
    });
  });

  beforeEach(async () => {
    // Clear all SEO cache keys
    const keys = await redis.keys('seo:meta:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  afterAll(async () => {
    await redis.quit();
  });

  describe('Cache Operations', () => {
    it('should cache and retrieve metadata', async () => {
      const metadata = {
        title: 'Test Title',
        description: 'Test Description',
        canonical: 'https://test.com/test',
        locale: 'en',
        ogTitle: 'Test OG',
        ogDescription: 'Test OG Desc',
        ogType: 'website',
        ogUrl: 'https://test.com/test',
        ogLocale: 'en_US',
        twitterCard: 'summary',
        twitterTitle: 'Test Twitter',
        twitterDescription: 'Test Twitter Desc',
      };

      await cache.set('/test', 'en', metadata);
      const cached = await cache.get('/test', 'en');

      expect(cached).toBeDefined();
      expect(cached?.title).toBe('Test Title');
      expect(cached?.description).toBe('Test Description');
    });

    it('should return null for non-existent cache', async () => {
      const cached = await cache.get('/non-existent', 'en');
      expect(cached).toBeNull();
    });

    it('should cache different locales separately', async () => {
      const metadataEn = {
        title: 'English Title',
        description: 'English Description',
        canonical: 'https://test.com/test',
        locale: 'en',
        ogTitle: 'Test',
        ogDescription: 'Test',
        ogType: 'website',
        ogUrl: 'https://test.com/test',
        ogLocale: 'en_US',
        twitterCard: 'summary',
        twitterTitle: 'Test',
        twitterDescription: 'Test',
      };

      const metadataHi = {
        ...metadataEn,
        title: 'Hindi Title',
        locale: 'hi',
      };

      await cache.set('/test', 'en', metadataEn);
      await cache.set('/test', 'hi', metadataHi);

      const cachedEn = await cache.get('/test', 'en');
      const cachedHi = await cache.get('/test', 'hi');

      expect(cachedEn?.title).toBe('English Title');
      expect(cachedHi?.title).toBe('Hindi Title');
    });
  });

  describe('ETag Generation', () => {
    it('should generate consistent ETags for same metadata', () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        canonical: 'https://test.com/test',
        locale: 'en',
        ogTitle: 'Test',
        ogDescription: 'Test',
        ogType: 'website',
        ogUrl: 'https://test.com/test',
        ogLocale: 'en_US',
        twitterCard: 'summary',
        twitterTitle: 'Test',
        twitterDescription: 'Test',
      };

      const etag1 = cache.generateETag(metadata);
      const etag2 = cache.generateETag(metadata);

      expect(etag1).toBe(etag2);
    });

    it('should generate different ETags for different metadata', () => {
      const metadata1 = {
        title: 'Test 1',
        description: 'Test',
        canonical: 'https://test.com/test',
        locale: 'en',
        ogTitle: 'Test',
        ogDescription: 'Test',
        ogType: 'website',
        ogUrl: 'https://test.com/test',
        ogLocale: 'en_US',
        twitterCard: 'summary',
        twitterTitle: 'Test',
        twitterDescription: 'Test',
      };

      const metadata2 = { ...metadata1, title: 'Test 2' };

      const etag1 = cache.generateETag(metadata1);
      const etag2 = cache.generateETag(metadata2);

      expect(etag1).not.toBe(etag2);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate specific path and locale', async () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        canonical: 'https://test.com/test',
        locale: 'en',
        ogTitle: 'Test',
        ogDescription: 'Test',
        ogType: 'website',
        ogUrl: 'https://test.com/test',
        ogLocale: 'en_US',
        twitterCard: 'summary',
        twitterTitle: 'Test',
        twitterDescription: 'Test',
      };

      await cache.set('/test', 'en', metadata);
      await cache.set('/test', 'hi', metadata);

      await cache.invalidate('/test', 'en');

      const cachedEn = await cache.get('/test', 'en');
      const cachedHi = await cache.get('/test', 'hi');

      expect(cachedEn).toBeNull();
      expect(cachedHi).toBeDefined(); // Hindi cache should remain
    });

    it('should invalidate all locales for a path', async () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        canonical: 'https://test.com/test',
        locale: 'en',
        ogTitle: 'Test',
        ogDescription: 'Test',
        ogType: 'website',
        ogUrl: 'https://test.com/test',
        ogLocale: 'en_US',
        twitterCard: 'summary',
        twitterTitle: 'Test',
        twitterDescription: 'Test',
      };

      await cache.set('/test', 'en', metadata);
      await cache.set('/test', 'hi', metadata);

      await cache.invalidate('/test'); // No locale specified

      const cachedEn = await cache.get('/test', 'en');
      const cachedHi = await cache.get('/test', 'hi');

      expect(cachedEn).toBeNull();
      expect(cachedHi).toBeNull();
    });

    it('should invalidate by pattern', async () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        canonical: 'https://test.com/test',
        locale: 'en',
        ogTitle: 'Test',
        ogDescription: 'Test',
        ogType: 'website',
        ogUrl: 'https://test.com/test',
        ogLocale: 'en_US',
        twitterCard: 'summary',
        twitterTitle: 'Test',
        twitterDescription: 'Test',
      };

      await cache.set('/p/product-1', 'en', metadata);
      await cache.set('/p/product-2', 'en', metadata);
      await cache.set('/s/store-1', 'en', metadata);

      await cache.invalidateByPattern('product:*');

      const cached1 = await cache.get('/p/product-1', 'en');
      const cached2 = await cache.get('/p/product-2', 'en');
      const cachedStore = await cache.get('/s/store-1', 'en');

      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
      expect(cachedStore).toBeDefined(); // Store cache should remain
    });
  });
});
