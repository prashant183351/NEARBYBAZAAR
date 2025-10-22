# SEO API Quick Reference

## 🚀 Quick Start

```bash
# Fetch SEO metadata for a product
GET /v1/seo?path=/p/cool-gadget&lang=en

# Fetch with conditional request (ETag)
GET /v1/seo?path=/p/cool-gadget
Header: If-None-Match: "abc123"

# Invalidate cache (admin)
DELETE /v1/seo/cache?path=/p/cool-gadget
```

---

## 📍 Supported Routes

| Route Type | Pattern                        | Example                  |
| ---------- | ------------------------------ | ------------------------ |
| Product    | `/p/{slug}`                    | `/p/wireless-headphones` |
| Store      | `/s/{slug}` or `/store/{slug}` | `/s/awesome-store`       |
| Category   | `/c/{slug}`                    | `/c/electronics`         |
| Home       | `/`                            | `/`                      |
| Search     | `/search`                      | `/search`                |
| Static     | Any other                      | `/about`                 |

---

## 🔑 API Endpoints

### GET /v1/seo

**Query Params:**

- `path` (required): Route path
- `lang` (optional): `en` or `hi` (default: `en`)

**Response (200):**

```json
{
  "title": "Cool Gadget | NearbyBazaar",
  "description": "An amazing gadget...",
  "canonical": "https://nearbybazaar.com/p/cool-gadget",
  "locale": "en",
  "alternateLocales": [{ "locale": "hi", "url": "..." }],
  "ogTitle": "Cool Gadget",
  "ogType": "product",
  "structuredData": { "@type": "Product", ... },
  "robots": "index, follow"
}
```

**Status Codes:**

- `200`: Success
- `304`: Not Modified (ETag matches)
- `400`: Bad Request
- `500`: Internal Error

---

## 💾 Caching

### Two-Tier Strategy

1. **Redis Cache**: 1 hour TTL (server-side)
2. **HTTP Cache**: ETag + Cache-Control (client-side)

### Cache Headers

```http
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
ETag: "5d41402abc4b2a76b9719d911017c592"
Last-Modified: Tue, 15 Oct 2025 14:30:00 GMT
Vary: Accept-Language
```

### Cache Keys

```
seo:meta:home:en
seo:meta:product:{slug}:en
seo:meta:store:{slug}:hi
seo:meta:category:{slug}:en
```

---

## 🔄 Cache Invalidation

```typescript
import { SeoCacheInvalidation } from './services/seo/cache';

// Single page
await SeoCacheInvalidation.invalidateProduct('cool-gadget');
await SeoCacheInvalidation.invalidateStore('store-slug');
await SeoCacheInvalidation.invalidateCategory('electronics');
await SeoCacheInvalidation.invalidateHome();

// Bulk invalidation
await SeoCacheInvalidation.invalidateAllProducts();
await SeoCacheInvalidation.invalidateAllStores();
```

### API Invalidation (Admin)

```bash
# Specific path
DELETE /v1/seo/cache?path=/p/cool-gadget

# Pattern
DELETE /v1/seo/cache?pattern=product:*

# All cache
DELETE /v1/seo/cache?all=true
```

---

## 🌍 Localization

**Supported Locales:** `en`, `hi`

```bash
# English (default)
GET /v1/seo?path=/p/product&lang=en

# Hindi
GET /v1/seo?path=/p/product&lang=hi
```

**OG Locale Mapping:**

- `en` → `en_US`
- `hi` → `hi_IN`

---

## 📦 Structured Data

### Product

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "offers": {
    "@type": "Offer",
    "price": 99.99,
    "priceCurrency": "USD"
  }
}
```

### Store

```json
{
  "@context": "https://schema.org",
  "@type": "Store",
  "name": "Store Name",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.5,
    "reviewCount": 120
  }
}
```

### Home

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://nearbybazaar.com/search?q={search_term_string}"
  }
}
```

---

## 🛠️ Usage Examples

### Next.js SSR

```typescript
export const getServerSideProps = async (context) => {
  const response = await fetch(
    `https://api.nearbybazaar.com/v1/seo?path=/p/${context.params.slug}`,
    {
      headers: {
        'If-None-Match': context.req.headers['if-none-match'] || '',
      },
    },
  );

  if (response.status === 304) {
    return { notModified: true };
  }

  const seo = await response.json();
  return { props: { seo } };
};
```

### React Component

```tsx
<Head>
  <title>{seo.title}</title>
  <meta name="description" content={seo.description} />
  <link rel="canonical" href={seo.canonical} />

  {/* Open Graph */}
  <meta property="og:title" content={seo.ogTitle} />
  <meta property="og:type" content={seo.ogType} />
  <meta property="og:image" content={seo.ogImage} />

  {/* Structured Data */}
  <script type="application/ld+json">{JSON.stringify(seo.structuredData)}</script>
</Head>
```

---

## 🎯 Performance

### Benchmarks

| Scenario              | Response Time |
| --------------------- | ------------- |
| Cache Miss (DB Query) | ~150ms        |
| Redis Cache Hit       | ~5-10ms       |
| HTTP 304 (ETag)       | ~1ms          |

### Optimization

```typescript
// Warm up cache for popular pages
const popular = await Product.find({ views: { $gt: 1000 } });
for (const p of popular) {
  await fetch(`/api/seo?path=/p/${p.slug}`);
}
```

---

## 🧪 Testing

```bash
# Run tests
pnpm --filter @nearbybazaar/api test:seo

# Manual test
curl "http://localhost:3000/v1/seo?path=/p/test-product&lang=en"

# Test ETag
curl -H "If-None-Match: abc123" \
  "http://localhost:3000/v1/seo?path=/p/test-product"
```

---

## ⚙️ Configuration

```bash
# .env
BASE_URL=https://nearbybazaar.com
REDIS_HOST=localhost
REDIS_PORT=6379
SEO_CACHE_TTL=3600
SEO_DEFAULT_IMAGE=/og-image.jpg
```

---

## 🚨 Common Issues

### Cache Not Working

1. Check Redis connection
2. Verify `initializeSeoService(redis)` called on startup
3. Check cache stats: `GET /v1/seo/cache/stats`

### Stale Metadata

1. Invalidate cache after updates:
   ```typescript
   ProductSchema.post('save', async (doc) => {
     await SeoCacheInvalidation.invalidateProduct(doc.slug);
   });
   ```

### 304 Not Working

1. Client must send `If-None-Match` header
2. ETag must match exactly
3. Check response headers include `ETag`

---

## 💡 Best Practices

1. ✅ **Always invalidate on content update**
2. ✅ **Use conditional requests (ETags)**
3. ✅ **Precompute popular pages**
4. ✅ **Include structured data for all page types**
5. ✅ **Set proper robots directives**
6. ✅ **Monitor cache hit rate**
7. ✅ **Use alternate locale links for i18n**

---

## 📞 Support

- **Docs**: [SEO_API.md](./SEO_API.md)
- **Tests**: `apps/api/tests/seo.spec.ts`
- **Code**: `apps/api/src/services/seo/`

---

**Last Updated**: October 20, 2025  
**Version**: 1.0.0
