/**
 * SEO Metadata Generator
 *
 * Generates SEO metadata (title, description, canonical, og tags, etc.)
 * for different route types with multi-language support
 */

import { getMetaTitle, getMetaDescription } from '@nearbybazaar/lib/seo';
import {
  getProductCanonical,
  getStoreCanonical,
  getCategoryCanonical,
  getSearchCanonical,
  generateCanonicalUrl,
} from '@nearbybazaar/lib/canonical';
import { Product } from '../../models/Product';
import { Vendor } from '../../models/Vendor';

export interface SeoMetadata {
  title: string;
  description: string;
  canonical: string;
  keywords?: string[];
  locale: string;
  alternateLocales?: { locale: string; url: string }[];

  // Open Graph
  ogTitle: string;
  ogDescription: string;
  ogType: string;
  ogUrl: string;
  ogImage?: string;
  ogLocale: string;

  // Twitter Card
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage?: string;

  // Structured Data
  structuredData?: Record<string, any>;

  // Robots
  robots?: string;

  // Additional metadata
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export interface SeoGeneratorOptions {
  locale?: string;
  baseUrl?: string;
  siteName?: string;
  defaultImage?: string;
  supportedLocales?: string[];
}

export type RouteType = 'product' | 'store' | 'category' | 'home' | 'search' | 'static';

export interface ParsedRoute {
  type: RouteType;
  params: Record<string, string>;
}

/**
 * Parse a path into route type and parameters
 */
export function parseRoute(path: string): ParsedRoute {
  // Remove query string
  const cleanPath = path.split('?')[0];

  // Product page: /p/{slug}
  if (cleanPath.startsWith('/p/')) {
    const slug = cleanPath.replace('/p/', '');
    return { type: 'product', params: { slug } };
  }

  // Store page: /s/{slug} or /store/{slug}
  if (cleanPath.startsWith('/s/') || cleanPath.startsWith('/store/')) {
    const slug = cleanPath.replace(/^\/(s|store)\//, '');
    return { type: 'store', params: { slug } };
  }

  // Category page: /c/{slug}
  if (cleanPath.startsWith('/c/')) {
    const slug = cleanPath.replace('/c/', '');
    return { type: 'category', params: { slug } };
  }

  // Search page
  if (cleanPath === '/search') {
    return { type: 'search', params: {} };
  }

  // Home page
  if (cleanPath === '/' || cleanPath === '') {
    return { type: 'home', params: {} };
  }

  // Static/other pages
  return { type: 'static', params: { path: cleanPath } };
}

/**
 * SEO Generator Service
 */
export class SeoGenerator {
  private baseUrl: string;
  private siteName: string;
  private defaultImage: string;
  private supportedLocales: string[];

  constructor(options: SeoGeneratorOptions = {}) {
    this.baseUrl = options.baseUrl || process.env.BASE_URL || 'https://nearbybazaar.com';
    this.siteName = options.siteName || 'NearbyBazaar';
    this.defaultImage = options.defaultImage || `${this.baseUrl}/og-image.jpg`;
    this.supportedLocales = options.supportedLocales || ['en', 'hi'];
  }

  /**
   * Generate SEO metadata for a given path
   */
  async generateMetadata(path: string, locale: string = 'en'): Promise<SeoMetadata> {
    const route = parseRoute(path);

    switch (route.type) {
      case 'product':
        return this.generateProductSeo(route.params.slug, locale);
      case 'store':
        return this.generateStoreSeo(route.params.slug, locale);
      case 'category':
        return this.generateCategorySeo(route.params.slug, locale);
      case 'search':
        return this.generateSearchSeo(locale);
      case 'home':
        return this.generateHomeSeo(locale);
      case 'static':
        return this.generateStaticSeo(route.params.path, locale);
      default:
        return this.generateDefaultSeo(path, locale);
    }
  }

  /**
   * Generate SEO for product pages
   */
  private async generateProductSeo(slug: string, locale: string): Promise<SeoMetadata> {
    const product = await Product.findOne({ slug, deleted: false })
      .populate('vendor', 'name slug')
      .lean();

    if (!product) {
      return this.generate404Seo(locale);
    }

    const vendor = product.vendor as any;
    const title = this.getLocalizedText(product.name, locale);
    const description = this.getLocalizedText(
      product.description || `Buy ${product.name} from ${vendor?.name || 'our store'}`,
      locale,
    );

    const canonical = getProductCanonical(this.baseUrl, slug);
    const image = product.media?.[0] || this.defaultImage;

    // Generate alternate locale URLs
    const alternateLocales = this.supportedLocales
      .filter((l) => l !== locale)
      .map((l) => ({
        locale: l,
        url: generateCanonicalUrl({
          baseUrl: this.baseUrl,
          path: `/p/${slug}`,
          params: { lang: l },
        }),
      }));

    // Structured data for Product
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description || '',
      image: image,
      sku: product.sku,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency || 'USD',
        availability: 'https://schema.org/InStock',
        url: canonical,
      },
      brand: {
        '@type': 'Brand',
        name: vendor?.name || this.siteName,
      },
    };

    return {
      title: getMetaTitle(title, this.siteName),
      description: getMetaDescription(description),
      canonical,
      keywords: this.generateProductKeywords(product, vendor),
      locale,
      alternateLocales,

      ogTitle: title,
      ogDescription: description,
      ogType: 'product',
      ogUrl: canonical,
      ogImage: image,
      ogLocale: this.getOgLocale(locale),

      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: image,

      structuredData,
      robots: 'index, follow',

      modifiedTime: (product as any).updatedAt?.toISOString(),
      publishedTime: (product as any).createdAt?.toISOString(),
    };
  }

  /**
   * Generate SEO for store/vendor pages
   */
  private async generateStoreSeo(slug: string, locale: string): Promise<SeoMetadata> {
    const vendor = await Vendor.findOne({ slug, deleted: false }).lean();

    if (!vendor) {
      return this.generate404Seo(locale);
    }

    const title = this.getLocalizedText(`${vendor.name} Store`, locale);
    const description = this.getLocalizedText(
      `Shop from ${vendor.name} on ${this.siteName}. Discover quality products and great deals.`,
      locale,
    );

    const canonical = getStoreCanonical(this.baseUrl, slug);
    const image = (vendor as any).logoUrl || this.defaultImage;

    const alternateLocales = this.supportedLocales
      .filter((l) => l !== locale)
      .map((l) => ({
        locale: l,
        url: generateCanonicalUrl({
          baseUrl: this.baseUrl,
          path: `/store/${slug}`,
          params: { lang: l },
        }),
      }));

    // Structured data for Store/Organization
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: vendor.name,
      url: canonical,
      logo: image,
      aggregateRating: (vendor as any).averageRating
        ? {
            '@type': 'AggregateRating',
            ratingValue: (vendor as any).averageRating,
            reviewCount: (vendor as any).reviewCount,
          }
        : undefined,
    };

    return {
      title: getMetaTitle(title, this.siteName),
      description: getMetaDescription(description),
      canonical,
      keywords: [vendor.name, 'store', 'shop', 'vendor', this.siteName],
      locale,
      alternateLocales,

      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      ogUrl: canonical,
      ogImage: image,
      ogLocale: this.getOgLocale(locale),

      twitterCard: 'summary',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: image,

      structuredData,
      robots: 'index, follow',
    };
  }

  /**
   * Generate SEO for category pages
   */
  private async generateCategorySeo(slug: string, locale: string): Promise<SeoMetadata> {
    // Category name from slug (capitalize and replace dashes)
    const categoryName = slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const title = this.getLocalizedText(`${categoryName}`, locale);
    const description = this.getLocalizedText(
      `Browse ${categoryName} on ${this.siteName}. Find the best products and deals.`,
      locale,
    );

    const canonical = getCategoryCanonical(this.baseUrl, slug);

    const alternateLocales = this.supportedLocales
      .filter((l) => l !== locale)
      .map((l) => ({
        locale: l,
        url: generateCanonicalUrl({
          baseUrl: this.baseUrl,
          path: `/category/${slug}`,
          params: { lang: l },
        }),
      }));

    // Structured data for CollectionPage
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: categoryName,
      url: canonical,
      description,
    };

    return {
      title: getMetaTitle(title, this.siteName),
      description: getMetaDescription(description),
      canonical,
      keywords: [categoryName, 'category', 'products', this.siteName],
      locale,
      alternateLocales,

      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      ogUrl: canonical,
      ogImage: this.defaultImage,
      ogLocale: this.getOgLocale(locale),

      twitterCard: 'summary',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: this.defaultImage,

      structuredData,
      robots: 'index, follow',
    };
  }

  /**
   * Generate SEO for search page
   */
  private async generateSearchSeo(locale: string): Promise<SeoMetadata> {
    const title = this.getLocalizedText('Search Products', locale);
    const description = this.getLocalizedText(
      `Search for products on ${this.siteName}. Find exactly what you're looking for.`,
      locale,
    );

    const canonical = getSearchCanonical(this.baseUrl);

    return {
      title: getMetaTitle(title, this.siteName),
      description: getMetaDescription(description),
      canonical,
      locale,

      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      ogUrl: canonical,
      ogImage: this.defaultImage,
      ogLocale: this.getOgLocale(locale),

      twitterCard: 'summary',
      twitterTitle: title,
      twitterDescription: description,

      robots: 'noindex, follow', // Don't index search pages
    };
  }

  /**
   * Generate SEO for home page
   */
  private async generateHomeSeo(locale: string): Promise<SeoMetadata> {
    const title = this.getLocalizedText(this.siteName, locale);
    const description = this.getLocalizedText(
      'Discover local vendors and quality products on NearbyBazaar. Your neighborhood marketplace.',
      locale,
    );

    const canonical = generateCanonicalUrl({
      baseUrl: this.baseUrl,
      path: '/',
    });

    const alternateLocales = this.supportedLocales
      .filter((l) => l !== locale)
      .map((l) => ({
        locale: l,
        url: generateCanonicalUrl({
          baseUrl: this.baseUrl,
          path: '/',
          params: { lang: l },
        }),
      }));

    // Structured data for Website
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.siteName,
      url: canonical,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${this.baseUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };

    return {
      title: getMetaTitle(title, ''),
      description: getMetaDescription(description),
      canonical,
      keywords: ['marketplace', 'local vendors', 'products', 'shopping'],
      locale,
      alternateLocales,

      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      ogUrl: canonical,
      ogImage: this.defaultImage,
      ogLocale: this.getOgLocale(locale),

      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: this.defaultImage,

      structuredData,
      robots: 'index, follow',
    };
  }

  /**
   * Generate SEO for static pages
   */
  private async generateStaticSeo(path: string, locale: string): Promise<SeoMetadata> {
    const title = this.getLocalizedText(
      path.replace(/^\//, '').replace(/-/g, ' ').replace(/\//g, ' - '),
      locale,
    );
    const description = this.getLocalizedText(`View ${title} on ${this.siteName}`, locale);

    const canonical = generateCanonicalUrl({
      baseUrl: this.baseUrl,
      path,
    });

    return {
      title: getMetaTitle(title, this.siteName),
      description: getMetaDescription(description),
      canonical,
      locale,

      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      ogUrl: canonical,
      ogImage: this.defaultImage,
      ogLocale: this.getOgLocale(locale),

      twitterCard: 'summary',
      twitterTitle: title,
      twitterDescription: description,

      robots: 'index, follow',
    };
  }

  /**
   * Generate default SEO metadata
   */
  private async generateDefaultSeo(path: string, locale: string): Promise<SeoMetadata> {
    return this.generateStaticSeo(path, locale);
  }

  /**
   * Generate 404 SEO metadata
   */
  private async generate404Seo(locale: string): Promise<SeoMetadata> {
    const title = this.getLocalizedText('Page Not Found', locale);
    const description = this.getLocalizedText(
      'The page you are looking for could not be found.',
      locale,
    );

    return {
      title: getMetaTitle(title, this.siteName),
      description: getMetaDescription(description),
      canonical: this.baseUrl,
      locale,

      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      ogUrl: this.baseUrl,
      ogImage: this.defaultImage,
      ogLocale: this.getOgLocale(locale),

      twitterCard: 'summary',
      twitterTitle: title,
      twitterDescription: description,

      robots: 'noindex, nofollow',
    };
  }

  /**
   * Generate keywords for a product
   */
  private generateProductKeywords(product: any, vendor: any): string[] {
    const keywords: string[] = [
      product.name,
      product.category || '',
      vendor?.name || '',
      product.sku,
      this.siteName,
    ].filter(Boolean);

    return keywords;
  }

  /**
   * Get localized text (stub - can be extended with actual i18n)
   */
  private getLocalizedText(text: string, _locale: string): string {
    // TODO: Implement actual i18n lookup
    // For now, return text as-is
    // In future: return translations[_locale][key] or use i18n library
    return text;
  }

  /**
   * Convert locale to Open Graph locale format
   */
  private getOgLocale(locale: string): string {
    const localeMap: Record<string, string> = {
      en: 'en_US',
      hi: 'hi_IN',
    };

    return localeMap[locale] || 'en_US';
  }
}

// Singleton instance
let seoGenerator: SeoGenerator | null = null;

/**
 * Get shared SEO generator instance
 */
export function getSeoGenerator(): SeoGenerator {
  if (!seoGenerator) {
    seoGenerator = new SeoGenerator();
  }
  return seoGenerator;
}
