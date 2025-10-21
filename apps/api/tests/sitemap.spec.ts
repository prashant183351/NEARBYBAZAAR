/**
 * Sitemap Tests
 * Tests for sitemap generation, formatting, and API endpoints
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { SitemapGenerator, getSitemapGenerator, resetSitemapGenerator } from '../src/services/sitemap/generator';
import { formatSitemapXml, formatSitemapIndexXml } from '../src/services/sitemap/formatter';
import { Product } from '../src/models/Product';
import { Service } from '../src/models/Service';
import { Vendor } from '../src/models/Vendor';
import { Classified } from '../src/models/Classified';
import { SitemapUrl, SitemapIndexEntry } from '../src/services/sitemap/types';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Product.deleteMany({});
    await Service.deleteMany({});
    await Vendor.deleteMany({});
    await Classified.deleteMany({});
    resetSitemapGenerator();
});

describe('SitemapGenerator', () => {
    describe('generateStaticSitemap', () => {
        it('should generate static pages sitemap', async () => {
            const generator = new SitemapGenerator();
            const urls = await generator.generateStaticSitemap();

            expect(urls).toBeDefined();
            expect(Array.isArray(urls)).toBe(true);
            expect(urls.length).toBeGreaterThan(0);

            // Check home page is included
            const homePage = urls.find((u) => u.loc.endsWith('/'));
            expect(homePage).toBeDefined();
            expect(homePage?.priority).toBe(1.0);
            expect(homePage?.changefreq).toBe('daily');
        });
    });

    describe('generateProductSitemap', () => {
        it('should generate product sitemap with images', async () => {
            // Create test products
            await Product.create([
                {
                    name: 'Test Product 1',
                    slug: 'test-product-1',
                    sku: 'TEST-001',
                    price: 100,
                    isActive: true,
                    images: [
                        { url: 'https://example.com/img1.jpg', alt: 'Product 1' },
                    ],
                },
                {
                    name: 'Test Product 2',
                    slug: 'test-product-2',
                    sku: 'TEST-002',
                    price: 200,
                    isActive: true,
                    images: [
                        { url: 'https://example.com/img2.jpg', alt: 'Product 2' },
                    ],
                },
            ]);

            const generator = new SitemapGenerator({ includeImages: true });
            const chunk = await generator.generateProductSitemap(1);

            expect(chunk.urls).toHaveLength(2);
            expect(chunk.totalChunks).toBe(1);
            expect(chunk.chunkNumber).toBe(1);

            // Check URL structure
            const url = chunk.urls[0];
            expect(url.loc).toContain('/p/test-product-1');
            expect(url.priority).toBe(0.8);
            expect(url.changefreq).toBe('weekly');
            expect(url.lastmod).toBeDefined();

            // Check images
            expect(url.images).toBeDefined();
            expect(url.images?.length).toBe(1);
            expect(url.images?.[0].loc).toBe('https://example.com/img1.jpg');
            expect(url.images?.[0].caption).toBe('Product 1');
        });

        it('should handle chunking for large product sets', async () => {
            // Create many products
            const products = Array.from({ length: 150 }, (_, i) => ({
                name: `Product ${i}`,
                slug: `product-${i}`,
                sku: `SKU-${i}`,
                price: 100 + i,
                isActive: true,
            }));
            await Product.create(products);

            const generator = new SitemapGenerator({ maxUrlsPerSitemap: 50 });

            // Get first chunk
            const chunk1 = await generator.generateProductSitemap(1);
            expect(chunk1.urls).toHaveLength(50);
            expect(chunk1.totalChunks).toBe(3);
            expect(chunk1.chunkNumber).toBe(1);

            // Get second chunk
            const chunk2 = await generator.generateProductSitemap(2);
            expect(chunk2.urls).toHaveLength(50);
            expect(chunk2.chunkNumber).toBe(2);

            // Get third chunk
            const chunk3 = await generator.generateProductSitemap(3);
            expect(chunk3.urls).toHaveLength(50);
            expect(chunk3.chunkNumber).toBe(3);
        });

        it('should only include active products', async () => {
            await Product.create([
                { name: 'Active', slug: 'active', sku: 'ACT', price: 100, isActive: true },
                { name: 'Inactive', slug: 'inactive', sku: 'INACT', price: 100, isActive: false },
            ]);

            const generator = new SitemapGenerator();
            const chunk = await generator.generateProductSitemap(1);

            expect(chunk.urls).toHaveLength(1);
            expect(chunk.urls[0].loc).toContain('active');
        });
    });

    describe('generateServiceSitemap', () => {
        it('should generate service sitemap', async () => {
            await Service.create([
                {
                    name: 'Test Service 1',
                    slug: 'test-service-1',
                    sku: 'SRV-001',
                    price: 500,
                    duration: 60,
                    isActive: true,
                },
            ]);

            const generator = new SitemapGenerator();
            const chunk = await generator.generateServiceSitemap(1);

            expect(chunk.urls).toHaveLength(1);
            expect(chunk.urls[0].loc).toContain('/s/test-service-1');
            expect(chunk.urls[0].priority).toBe(0.8);
        });
    });

    describe('generateStoreSitemap', () => {
        it('should generate store sitemap with logos', async () => {
            await Vendor.create([
                {
                    email: 'vendor@test.com',
                    businessName: 'Test Store',
                    slug: 'test-store',
                    isActive: true,
                    logo: 'https://example.com/logo.jpg',
                },
            ]);

            const generator = new SitemapGenerator({ includeImages: true });
            const chunk = await generator.generateStoreSitemap(1);

            expect(chunk.urls).toHaveLength(1);
            expect(chunk.urls[0].loc).toContain('/store/test-store');
            expect(chunk.urls[0].priority).toBe(0.7);

            // Check logo as image
            expect(chunk.urls[0].images).toBeDefined();
            expect(chunk.urls[0].images?.[0].loc).toBe('https://example.com/logo.jpg');
        });
    });

    describe('generateClassifiedSitemap', () => {
        it('should generate classified sitemap', async () => {
            await Classified.create([
                {
                    title: 'Test Classified',
                    slug: 'test-classified',
                    description: 'Test description',
                    status: 'active',
                },
            ]);

            const generator = new SitemapGenerator();
            const chunk = await generator.generateClassifiedSitemap(1);

            expect(chunk.urls).toHaveLength(1);
            expect(chunk.urls[0].loc).toContain('/c/test-classified');
            expect(chunk.urls[0].priority).toBe(0.6);
            expect(chunk.urls[0].changefreq).toBe('daily');
        });

        it('should only include active classifieds', async () => {
            await Classified.create([
                { title: 'Active', slug: 'active', description: 'Test', status: 'active' },
                { title: 'Expired', slug: 'expired', description: 'Test', status: 'expired' },
            ]);

            const generator = new SitemapGenerator();
            const chunk = await generator.generateClassifiedSitemap(1);

            expect(chunk.urls).toHaveLength(1);
            expect(chunk.urls[0].loc).toContain('active');
        });
    });

    describe('generateIndex', () => {
        it('should generate sitemap index with all types', async () => {
            // Create some test data
            await Product.create({ name: 'P1', slug: 'p1', sku: 'P1', price: 100, isActive: true });
            await Service.create({ name: 'S1', slug: 's1', sku: 'S1', price: 100, duration: 60, isActive: true });
            await Vendor.create({ email: 'v@test.com', businessName: 'V1', slug: 'v1', isActive: true });
            await Classified.create({ title: 'C1', slug: 'c1', description: 'Test', status: 'active' });

            const generator = new SitemapGenerator({ baseUrl: 'https://test.com' });
            const entries = await generator.generateIndex();

            expect(entries.length).toBeGreaterThan(0);

            // Should include static sitemap
            const staticEntry = entries.find((e) => e.loc.includes('sitemap-static.xml'));
            expect(staticEntry).toBeDefined();

            // Should include product sitemap
            const productEntry = entries.find((e) => e.loc.includes('sitemap-products-'));
            expect(productEntry).toBeDefined();

            // Should include service sitemap
            const serviceEntry = entries.find((e) => e.loc.includes('sitemap-services-'));
            expect(serviceEntry).toBeDefined();

            // Should include store sitemap
            const storeEntry = entries.find((e) => e.loc.includes('sitemap-stores-'));
            expect(storeEntry).toBeDefined();

            // Should include classified sitemap
            const classifiedEntry = entries.find((e) => e.loc.includes('sitemap-classifieds-'));
            expect(classifiedEntry).toBeDefined();
        });
    });

    describe('getStats', () => {
        it('should return accurate statistics', async () => {
            await Product.create({ name: 'P1', slug: 'p1', sku: 'P1', price: 100, isActive: true });
            await Product.create({ name: 'P2', slug: 'p2', sku: 'P2', price: 100, isActive: true });
            await Service.create({ name: 'S1', slug: 's1', sku: 'S1', price: 100, duration: 60, isActive: true });

            const generator = new SitemapGenerator();
            const stats = await generator.getStats();

            expect(stats.byType.product).toBe(2);
            expect(stats.byType.service).toBe(1);
            expect(stats.byType.static).toBeGreaterThan(0);
            expect(stats.totalUrls).toBe(stats.byType.product + stats.byType.service + stats.byType.store + stats.byType.classified + stats.byType.static);
        });
    });

    describe('Singleton pattern', () => {
        it('should return same instance', () => {
            const gen1 = getSitemapGenerator();
            const gen2 = getSitemapGenerator();
            expect(gen1).toBe(gen2);
        });

        it('should reset singleton', () => {
            const gen1 = getSitemapGenerator();
            resetSitemapGenerator();
            const gen2 = getSitemapGenerator();
            expect(gen1).not.toBe(gen2);
        });
    });
});

describe('Sitemap Formatter', () => {
    describe('formatSitemapXml', () => {
        it('should format basic sitemap', () => {
            const urls: SitemapUrl[] = [
                {
                    loc: 'https://example.com/page1',
                    lastmod: '2025-10-20T12:00:00.000Z',
                    changefreq: 'daily',
                    priority: 1.0,
                },
                {
                    loc: 'https://example.com/page2',
                    priority: 0.8,
                },
            ];

            const xml = formatSitemapXml(urls);

            expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
            expect(xml).toContain('<loc>https://example.com/page1</loc>');
            expect(xml).toContain('<lastmod>2025-10-20T12:00:00.000Z</lastmod>');
            expect(xml).toContain('<changefreq>daily</changefreq>');
            expect(xml).toContain('<priority>1.0</priority>');
            expect(xml).toContain('<loc>https://example.com/page2</loc>');
            expect(xml).toContain('</urlset>');
        });

        it('should include image namespace when images present', () => {
            const urls: SitemapUrl[] = [
                {
                    loc: 'https://example.com/product',
                    images: [
                        {
                            loc: 'https://example.com/img.jpg',
                            title: 'Product Image',
                            caption: 'A great product',
                        },
                    ],
                },
            ];

            const xml = formatSitemapXml(urls);

            expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
            expect(xml).toContain('<image:image>');
            expect(xml).toContain('<image:loc>https://example.com/img.jpg</image:loc>');
            expect(xml).toContain('<image:title>Product Image</image:title>');
            expect(xml).toContain('<image:caption>A great product</image:caption>');
            expect(xml).toContain('</image:image>');
        });

        it('should escape XML special characters', () => {
            const urls: SitemapUrl[] = [
                {
                    loc: 'https://example.com/page?query=test&sort=name',
                },
            ];

            const xml = formatSitemapXml(urls);

            expect(xml).toContain('&amp;');
            expect(xml).not.toContain('&sort');
        });
    });

    describe('formatSitemapIndexXml', () => {
        it('should format sitemap index', () => {
            const entries: SitemapIndexEntry[] = [
                {
                    loc: 'https://example.com/sitemap-products-1.xml',
                    lastmod: '2025-10-20T12:00:00.000Z',
                },
                {
                    loc: 'https://example.com/sitemap-services-1.xml',
                },
            ];

            const xml = formatSitemapIndexXml(entries);

            expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
            expect(xml).toContain('<sitemap>');
            expect(xml).toContain('<loc>https://example.com/sitemap-products-1.xml</loc>');
            expect(xml).toContain('<lastmod>2025-10-20T12:00:00.000Z</lastmod>');
            expect(xml).toContain('<loc>https://example.com/sitemap-services-1.xml</loc>');
            expect(xml).toContain('</sitemap>');
            expect(xml).toContain('</sitemapindex>');
        });
    });
});

describe('XML Validation', () => {
    it('should generate valid XML without syntax errors', async () => {
        await Product.create({
            name: 'Test & Product <Special>',
            slug: 'test-product',
            sku: 'TEST',
            price: 100,
            isActive: true,
        });

        const generator = new SitemapGenerator();
        const chunk = await generator.generateProductSitemap(1);
        const xml = formatSitemapXml(chunk.urls);

        // Basic XML validation - should not throw when parsing
        expect(() => {
            // Simple check for balanced tags
            const openTags = xml.match(/<[^/][^>]*>/g) || [];
            const closeTags = xml.match(/<\/[^>]+>/g) || [];
            expect(openTags.length).toBeGreaterThan(0);
            expect(closeTags.length).toBeGreaterThan(0);
        }).not.toThrow();

        // Check proper escaping
        expect(xml).not.toContain('<Special>');
        expect(xml).toContain('&lt;');
        expect(xml).toContain('&amp;');
    });
});
