# Server SEO API Documentation

## Overview

The Server SEO API provides dynamic SEO metadata generation for all routes in the NearbyBazaar platform. It supports server-side rendering, multi-language content, HTTP caching, and Redis-based performance optimization.

## Table of Contents

- [Features](#features)
- [API Endpoints](#api-endpoints)
- [Route Types](#route-types)
- [Caching Strategy](#caching-strategy)
- [Localization](#localization)
- [Usage Examples](#usage-examples)
- [Cache Invalidation](#cache-invalidation)
- [Performance](#performance)
- [Testing](#testing)

---

## Features

✅ **Dynamic Metadata Generation**: Generates SEO metadata for products, stores, categories, and more  
✅ **Multi-Language Support**: Localized metadata with alternate locale links (en, hi)  
✅ **HTTP Caching**: ETag and Last-Modified headers for client-side caching  
✅ **Redis Caching**: Server-side caching with configurable TTL  
✅ **Structured Data**: Automatic JSON-LD generation for rich snippets  
✅ **Open Graph & Twitter Cards**: Social media optimization  
✅ **Fail-Safe**: Graceful fallback if cache unavailable

---

## API Endpoints

### GET /v1/seo

Fetch SEO metadata for a given path.

**Query Parameters:**

- `path` (required): The route path (e.g., `/p/product-slug`, `/s/store-slug`)
- `lang` (optional): Locale code (default: `en`, supported: `en`, `hi`)

**Headers:**

- `If-None-Match`: ETag for conditional requests (returns 304 if unchanged)

**Response (200 OK):**

```json
{
  "title": "Cool Gadget | NearbyBazaar",
  "description": "An amazing gadget that does cool things",
  "canonical": "https://nearbybazaar.com/p/cool-gadget",
  "keywords": ["Cool Gadget", "electronics", "Vendor Name", "SKU-001"],
  "locale": "en",
  "alternateLocales": [{ "locale": "hi", "url": "https://nearbybazaar.com/p/cool-gadget?lang=hi" }],
  "ogTitle": "Cool Gadget",
  "ogDescription": "An amazing gadget that does cool things",
  "ogType": "product",
  "ogUrl": "https://nearbybazaar.com/p/cool-gadget",
  "ogImage": "https://cdn.nearbybazaar.com/images/product.jpg",
  "ogLocale": "en_US",
  "twitterCard": "summary_large_image",
  "twitterTitle": "Cool Gadget",
  "twitterDescription": "An amazing gadget that does cool things",
  "twitterImage": "https://cdn.nearbybazaar.com/images/product.jpg",
  "structuredData": {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Cool Gadget",
    "description": "An amazing gadget that does cool things",
    "image": "https://cdn.nearbybazaar.com/images/product.jpg",
    "sku": "SKU-001",
    "offers": {
      "@type": "Offer",
      "price": 99.99,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://nearbybazaar.com/p/cool-gadget"
    },
    "brand": {
      "@type": "Brand",
      "name": "Vendor Name"
    }
  },
  "robots": "index, follow",
  "publishedTime": "2025-10-01T12:00:00.000Z",
  "modifiedTime": "2025-10-15T14:30:00.000Z"
}
```

**Response Headers:**

```
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
ETag: "5d41402abc4b2a76b9719d911017c592"
Last-Modified: Tue, 15 Oct 2025 14:30:00 GMT
Vary: Accept-Language
```

**Error Responses:**

- `304 Not Modified`: ETag matches (no body)
- `400 Bad Request`: Missing or invalid parameters
- `500 Internal Server Error`: Server error

---

### DELETE /v1/seo/cache

Invalidate SEO cache (admin only).

**Query Parameters:**

- `path` (optional): Specific path to invalidate
- `pattern` (optional): Pattern to match (e.g., `product:*`)
- `all` (optional): Invalidate all cache (`true`)

**Examples:**

```bash
# Invalidate specific product
DELETE /v1/seo/cache?path=/p/cool-gadget

# Invalidate all products
DELETE /v1/seo/cache?pattern=product:*

# Invalidate all cache
DELETE /v1/seo/cache?all=true
```

---

### GET /v1/seo/cache/stats

Get cache statistics (admin only).

**Response:**

```json
{
  "enabled": true,
  "keys": 1523,
  "memory": 2456789
}
```

---

## Route Types

The SEO API supports the following route types:

### Product Pages

**Pattern:** `/p/{slug}`

**Metadata Includes:**

- Product name, description, price
- Product images
- Vendor/brand information
- Product structured data (Schema.org Product)
- SKU and category keywords

**Example:**

```bash
GET /v1/seo?path=/p/wireless-headphones&lang=en
```

---

### Store/Vendor Pages

**Pattern:** `/s/{slug}` or `/store/{slug}`

**Metadata Includes:**

- Store name and description
- Store logo
- Aggregate ratings (if available)
- Store structured data (Schema.org Store)

**Example:**

```bash
GET /v1/seo?path=/s/awesome-electronics&lang=en
```

---

### Category Pages

**Pattern:** `/c/{slug}`

**Metadata Includes:**

- Category name (auto-formatted from slug)
- Generic category description
- Collection page structured data

**Example:**

```bash
GET /v1/seo?path=/c/home-appliances&lang=en
```

---

### Home Page

**Pattern:** `/`

**Metadata Includes:**

- Site name and description
- Website structured data
- Search action structured data

---

### Search Page

**Pattern:** `/search`

**Metadata Includes:**

- Generic search page metadata
- `noindex, follow` robots directive (don't index search pages)

---

### Static Pages

**Pattern:** Any other path

**Metadata Includes:**

- Generic metadata based on path
- Default structured data

---

## Caching Strategy

### Two-Tier Caching

1. **Redis Cache (Server-Side)**
   - TTL: 1 hour (3600 seconds)
   - Reduces database queries
   - Per-locale caching

2. **HTTP Cache (Client-Side)**
   - `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`
   - Clients can cache for 1 hour
   - Stale content served while revalidating (24 hours)

### Cache Keys

Redis cache keys are structured for readability:

```
seo:meta:home:en                          # Home page (English)
seo:meta:product:cool-gadget:hi          # Product page (Hindi)
seo:meta:store:awesome-store:en          # Store page (English)
seo:meta:category:electronics:en         # Category page
seo:meta:{hash}:en                       # Other pages (MD5 hash)
```

### ETag Generation

ETags are MD5 hashes of the metadata JSON:

- Consistent across requests for same content
- Changes when metadata updates
- Enables conditional requests (304 responses)

### Stale-While-Revalidate

Clients can serve stale content while fetching fresh data in background:

- Improves perceived performance
- Reduces server load
- 24-hour stale window

---

## Localization

### Supported Locales

- `en` (English) - Default
- `hi` (Hindi)

### Locale Selection

Specify locale via `lang` query parameter:

```bash
GET /v1/seo?path=/p/product&lang=hi
```

### Alternate Locale Links

Metadata includes alternate locale URLs for SEO:

```json
{
  "locale": "en",
  "alternateLocales": [{ "locale": "hi", "url": "https://nearbybazaar.com/p/product?lang=hi" }]
}
```

### Open Graph Locale

Locales are mapped to OG locale format:

- `en` → `en_US`
- `hi` → `hi_IN`

### Future i18n Support

The service includes a stub for full i18n:

```typescript
// In generator.ts
private getLocalizedText(text: string, locale: string): string {
    // TODO: Implement actual i18n lookup
    // return translations[locale][key] or use i18n library
    return text;
}
```

---

## Usage Examples

### Server-Side Rendering (Next.js)

```typescript
// pages/p/[slug].tsx
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, lang = 'en' } = context.params;

  const response = await fetch(
    `https://api.nearbybazaar.com/v1/seo?path=/p/${slug}&lang=${lang}`,
    {
      headers: {
        'If-None-Match': context.req.headers['if-none-match'] || '',
      },
    }
  );

  if (response.status === 304) {
    // Use cached metadata
    return { notModified: true };
  }

  const seoMetadata = await response.json();

  return {
    props: {
      seoMetadata,
    },
  };
};

export default function ProductPage({ seoMetadata }) {
  return (
    <>
      <Head>
        <title>{seoMetadata.title}</title>
        <meta name="description" content={seoMetadata.description} />
        <link rel="canonical" href={seoMetadata.canonical} />

        {/* Open Graph */}
        <meta property="og:title" content={seoMetadata.ogTitle} />
        <meta property="og:description" content={seoMetadata.ogDescription} />
        <meta property="og:type" content={seoMetadata.ogType} />
        <meta property="og:url" content={seoMetadata.ogUrl} />
        <meta property="og:image" content={seoMetadata.ogImage} />

        {/* Twitter Card */}
        <meta name="twitter:card" content={seoMetadata.twitterCard} />
        <meta name="twitter:title" content={seoMetadata.twitterTitle} />
        <meta name="twitter:description" content={seoMetadata.twitterDescription} />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(seoMetadata.structuredData),
          }}
        />

        {/* Alternate Locales */}
        {seoMetadata.alternateLocales?.map((alt) => (
          <link
            key={alt.locale}
            rel="alternate"
            hrefLang={alt.locale}
            href={alt.url}
          />
        ))}
      </Head>

      {/* Page content */}
    </>
  );
}
```

### Static Site Generation (Next.js)

```typescript
// pages/p/[slug].tsx
import { GetStaticProps } from 'next';

export const getStaticProps: GetStaticProps = async (context) => {
  const { slug, lang = 'en' } = context.params;

  const response = await fetch(`https://api.nearbybazaar.com/v1/seo?path=/p/${slug}&lang=${lang}`);

  const seoMetadata = await response.json();

  return {
    props: { seoMetadata },
    revalidate: 3600, // Revalidate every hour
  };
};
```

### React Hook

```typescript
// hooks/useSeoMetadata.ts
import { useEffect, useState } from 'react';

export function useSeoMetadata(path: string, lang = 'en') {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/seo?path=${path}&lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        setMetadata(data);
        setLoading(false);
      });
  }, [path, lang]);

  return { metadata, loading };
}
```

---

## Cache Invalidation

### When to Invalidate

Invalidate cache when content changes:

1. **Product Updated**: Invalidate product page
2. **Vendor Updated**: Invalidate store page
3. **Product Deleted**: Invalidate product and category pages
4. **Price Changed**: Invalidate product page

### Programmatic Invalidation

```typescript
import { SeoCacheInvalidation } from '../services/seo/cache';

// Invalidate product page
await SeoCacheInvalidation.invalidateProduct('cool-gadget');

// Invalidate store page
await SeoCacheInvalidation.invalidateStore('awesome-store');

// Invalidate category page
await SeoCacheInvalidation.invalidateCategory('electronics');

// Invalidate all products
await SeoCacheInvalidation.invalidateAllProducts();

// Invalidate home page
await SeoCacheInvalidation.invalidateHome();
```

### Model Hooks

Integrate cache invalidation into Mongoose post-save hooks:

```typescript
// In Product model
ProductSchema.post('save', async function (doc) {
  // Invalidate product page cache
  await SeoCacheInvalidation.invalidateProduct(doc.slug);

  // Invalidate category page if category changed
  if (doc.category) {
    await SeoCacheInvalidation.invalidateCategory(doc.category);
  }
});

ProductSchema.post('remove', async function (doc) {
  await SeoCacheInvalidation.invalidateProduct(doc.slug);
});
```

### Bulk Invalidation

For large content updates:

```bash
# Via API (admin only)
DELETE /v1/seo/cache?all=true
```

---

## Performance

### Benchmark Results

Without Cache:

- Product page: ~150ms (DB queries)
- Store page: ~120ms (DB queries)

With Redis Cache (Hit):

- Any page: ~5-10ms (Redis lookup)

With HTTP Cache (304):

- Any page: ~1ms (no body transfer)

### Optimization Tips

1. **Precompute Common Pages**

   ```typescript
   // Warm up cache for popular products
   const popularProducts = await Product.find({ views: { $gt: 1000 } });
   for (const product of popularProducts) {
     await fetch(`/api/seo?path=/p/${product.slug}`);
   }
   ```

2. **Use CDN Caching**

   ```nginx
   # Nginx config
   location /v1/seo {
     proxy_cache seo_cache;
     proxy_cache_valid 200 1h;
     proxy_cache_use_stale error timeout updating;
   }
   ```

3. **Monitor Cache Hit Rate**
   ```bash
   GET /v1/seo/cache/stats
   ```

---

## Testing

### Run Tests

```bash
# Run SEO tests
pnpm --filter @nearbybazaar/api test seo.spec.ts

# Run with coverage
pnpm --filter @nearbybazaar/api test seo.spec.ts --coverage
```

### Test Coverage

- ✅ Route parsing (product, store, category, home, search, static)
- ✅ Metadata generation for all route types
- ✅ Product structured data
- ✅ Store structured data
- ✅ Localization (en, hi)
- ✅ Alternate locale links
- ✅ 404 handling
- ✅ Cache set/get operations
- ✅ ETag generation
- ✅ Cache invalidation (specific, all locales, pattern)
- ✅ Multi-locale caching

### Manual Testing

```bash
# Test product page
curl "http://localhost:3000/v1/seo?path=/p/test-product&lang=en"

# Test with ETag
curl -H "If-None-Match: abc123" "http://localhost:3000/v1/seo?path=/p/test-product"

# Test cache invalidation
curl -X DELETE "http://localhost:3000/v1/seo/cache?path=/p/test-product"

# Test cache stats
curl "http://localhost:3000/v1/seo/cache/stats"
```

---

## Configuration

### Environment Variables

```bash
# Base URL for canonical links
BASE_URL=https://nearbybazaar.com

# Redis configuration (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# SEO configuration (optional)
SEO_CACHE_TTL=3600              # Cache TTL in seconds (default: 3600)
SEO_DEFAULT_IMAGE=/og-image.jpg # Default OG image
```

### Initialization

```typescript
// In app startup (src/index.ts)
import Redis from 'ioredis';
import { initializeSeoService } from './routes/seo';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

initializeSeoService(redis);
```

---

## Best Practices

1. **Always Use Canonical URLs**: Prevents duplicate content issues
2. **Set Proper Robots Directives**: `noindex` for search, 404, etc.
3. **Include Structured Data**: Improves search result appearance
4. **Use ETags**: Reduces bandwidth and server load
5. **Invalidate on Updates**: Keep SEO metadata fresh
6. **Monitor Cache Hit Rate**: Optimize frequently accessed pages
7. **Precompute Popular Pages**: Warm cache for high-traffic content
8. **Use Alternate Locale Links**: Helps search engines understand multi-language content

---

## Future Enhancements

- [ ] Full i18n integration with translation library
- [ ] Sitemap generation endpoint
- [ ] Robots.txt generation
- [ ] Image optimization for OG tags
- [ ] A/B testing for metadata
- [ ] Analytics integration for click-through rates
- [ ] Automatic metadata suggestions based on content analysis

---

**Last Updated**: October 20, 2025  
**Version**: 1.0.0
