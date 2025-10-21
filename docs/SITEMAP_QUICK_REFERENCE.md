# Sitemap Quick Reference

One-page reference for sitemap generation and robots.txt.

## URLs

| URL | Description |
|-----|-------------|
| `/sitemap.xml` | Main sitemap index |
| `/sitemap-static.xml` | Static pages |
| `/sitemap-products-{n}.xml` | Products (chunked) |
| `/sitemap-services-{n}.xml` | Services (chunked) |
| `/sitemap-stores-{n}.xml` | Store pages (chunked) |
| `/sitemap-classifieds-{n}.xml` | Classifieds (chunked) |
| `/robots.txt` | Robots.txt file |

## API Endpoints

```bash
# Get sitemap index
GET /v1/sitemap/index

# Get specific sitemap chunk
GET /v1/sitemap/:type/:chunk
# Examples:
GET /v1/sitemap/static/1
GET /v1/sitemap/product/1
GET /v1/sitemap/service/2

# Get statistics
GET /v1/sitemap/stats
```

## Usage

### Generate Sitemap

```typescript
import { getSitemapGenerator } from '@/services/sitemap/generator';

const generator = getSitemapGenerator();

// Static pages
const staticUrls = await generator.generateStaticSitemap();

// Products (chunk 1)
const products = await generator.generateProductSitemap(1);

// Services (chunk 1)
const services = await generator.generateServiceSitemap(1);

// Stores (chunk 1)
const stores = await generator.generateStoreSitemap(1);

// Classifieds (chunk 1)
const classifieds = await generator.generateClassifiedSitemap(1);

// Sitemap index
const index = await generator.generateIndex();

// Statistics
const stats = await generator.getStats();
```

### Format as XML

```typescript
import { formatSitemapXml, formatSitemapIndexXml } from '@/services/sitemap/formatter';

// Format sitemap
const xml = formatSitemapXml(chunk.urls);

// Format index
const indexXml = formatSitemapIndexXml(entries);
```

### Custom Configuration

```typescript
import { SitemapGenerator } from '@/services/sitemap/generator';

const generator = new SitemapGenerator({
  baseUrl: 'https://nearbybazaar.com',
  maxUrlsPerSitemap: 50000,
  includeImages: true,
  defaultChangeFreq: 'weekly',
});
```

## Priority & Change Frequency

| Type | Priority | Changefreq |
|------|----------|------------|
| Homepage | 1.0 | daily |
| Search | 0.8 | daily |
| Products | 0.8 | weekly |
| Services | 0.8 | weekly |
| Stores | 0.7 | weekly |
| Classifieds | 0.6 | daily |
| Static | 0.5 | weekly |

## Chunking

- **Max URLs per sitemap:** 50,000
- **Chunks calculated automatically** based on entity count
- **Numbered sequentially:** `sitemap-products-1.xml`, `sitemap-products-2.xml`, etc.

## robots.txt

```txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /vendor
Disallow: /api/
Disallow: /cart
Disallow: /checkout

Sitemap: https://nearbybazaar.com/sitemap.xml
```

## Cache Headers

```
Content-Type: application/xml; charset=utf-8
Cache-Control: public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400
```

- **Browser cache:** 1 hour
- **CDN cache:** 2 hours
- **Stale while revalidate:** 24 hours

## Testing

```bash
# Run sitemap tests
pnpm --filter @nearbybazaar/api test sitemap

# With coverage
pnpm --filter @nearbybazaar/api test:coverage sitemap
```

## Submit to Search Engines

```bash
# Google
curl "https://www.google.com/ping?sitemap=https://nearbybazaar.com/sitemap.xml"

# Bing
curl "https://www.bing.com/ping?sitemap=https://nearbybazaar.com/sitemap.xml"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Sitemap not updating | Check cache headers, wait for expiry, or clear CDN cache |
| Missing images | Verify `includeImages: true` and product has images array |
| 404 on chunk | Check chunk number is within `totalChunks` range |
| Invalid XML | Ensure special characters are escaped (`&`, `<`, `>`) |

## Environment Variables

```env
BASE_URL=https://nearbybazaar.com
NEXT_PUBLIC_API_URL=https://api.nearbybazaar.com
```

## File Structure

```
apps/
  api/src/
    services/sitemap/
      types.ts          # TypeScript definitions
      generator.ts      # Sitemap generation
      formatter.ts      # XML formatting
    routes/
      sitemap.ts        # API endpoints
  web/
    pages/
      sitemap.xml.ts    # Main sitemap route
      api/sitemap/
        [filename].ts   # Dynamic sitemap route
    public/
      robots.txt        # Static robots.txt
```

## Statistics Response

```json
{
  "success": true,
  "data": {
    "totalUrls": 15243,
    "totalSitemaps": 5,
    "byType": {
      "static": 3,
      "product": 10000,
      "service": 2500,
      "store": 1500,
      "classified": 1240
    },
    "generatedAt": "2025-10-20T12:00:00.000Z"
  }
}
```

---

For complete documentation, see [SITEMAP.md](./SITEMAP.md)
