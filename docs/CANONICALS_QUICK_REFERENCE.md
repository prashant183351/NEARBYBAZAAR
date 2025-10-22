# Canonical URLs - Quick Reference

> **One-page cheat sheet for canonical URL implementation**

## Quick Start

```typescript
import {
  getProductCanonical,
  getStoreCanonical,
  stripTrackingParams,
} from '@nearbybazaar/lib/canonical';

// Product page
const canonical = getProductCanonical(baseUrl, 'laptop-stand');
<SeoHead canonicalUrl={canonical} />

// Store page with tab
const canonical = getStoreCanonical(baseUrl, 'store-slug', { tab: 'services' });
<SeoHead canonicalUrl={canonical} />
```

## Common Functions

| Function                                        | Purpose          | Example                                                  |
| ----------------------------------------------- | ---------------- | -------------------------------------------------------- |
| `getProductCanonical(baseUrl, slug, options?)`  | Product pages    | `getProductCanonical(base, 'laptop')`                    |
| `getServiceCanonical(baseUrl, slug)`            | Service pages    | `getServiceCanonical(base, 'cleaning')`                  |
| `getStoreCanonical(baseUrl, slug, options?)`    | Store pages      | `getStoreCanonical(base, 'johns', { tab: 'services' })`  |
| `getClassifiedCanonical(baseUrl, slug)`         | Classified pages | `getClassifiedCanonical(base, 'bike')`                   |
| `getCategoryCanonical(baseUrl, slug, options?)` | Category pages   | `getCategoryCanonical(base, 'electronics', { page: 2 })` |
| `getSearchCanonical(baseUrl, options?)`         | Search pages     | `getSearchCanonical(base, { q: 'laptop' })`              |
| `stripTrackingParams(url)`                      | Remove tracking  | `stripTrackingParams(url)`                               |
| `normalizeUrl(url, options?)`                   | Normalize URL    | `normalizeUrl(url)`                                      |

## URL Patterns

| Content Type | Pattern            | Canonical Example                                  |
| ------------ | ------------------ | -------------------------------------------------- |
| Product      | `/p/{slug}`        | `https://nearbybazaar.com/p/laptop-stand`          |
| Service      | `/s/{slug}`        | `https://nearbybazaar.com/s/home-cleaning`         |
| Store        | `/store/{slug}`    | `https://nearbybazaar.com/store/johns-electronics` |
| Classified   | `/c/{slug}`        | `https://nearbybazaar.com/c/used-bike`             |
| Category     | `/category/{slug}` | `https://nearbybazaar.com/category/electronics`    |
| Search       | `/search`          | `https://nearbybazaar.com/search?q=laptop`         |
| Home         | `/`                | `https://nearbybazaar.com/`                        |

## Tracking Parameters Removed

**UTM:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`  
**Social:** `fbclid`, `gclid`, `msclkid`, `twclid`  
**Email:** `mc_cid`, `mc_eid`  
**Other:** `ref`, `referrer`, `sessionid`, `sid`, `_ga`

## Page Implementation Examples

### Product Page

```tsx
import { getProductCanonical } from '@nearbybazaar/lib/canonical';

const canonical = getProductCanonical(
  process.env.NEXT_PUBLIC_BASE_URL || 'https://nearbybazaar.com',
  slug,
);

<SeoHead title="Product Name" description="Product description" canonicalUrl={canonical} />;
```

### Store Page

```tsx
import { getStoreCanonical } from '@nearbybazaar/lib/canonical';

const canonical = getStoreCanonical(
  baseUrl,
  vendor.slug,
  currentTab !== 'products' ? { tab: currentTab } : undefined,
);

<SeoHead canonicalUrl={canonical} />;
```

### Search Page

```tsx
import { getSearchCanonical } from '@nearbybazaar/lib/canonical';

const canonical = getSearchCanonical(baseUrl, {
  q: query || undefined,
  type: type !== 'all' ? type : undefined,
});

<SeoHead canonicalUrl={canonical} noindex={true} />;
```

## Options & Customization

```typescript
generateCanonicalUrl({
  baseUrl: 'https://nearbybazaar.com',
  path: '/p/laptop-stand',
  params: { variant: 'black' }, // Optional query params
  trailingSlash: false, // Default: false
  forceHttps: true, // Default: true
  lowercasePath: true, // Default: true
});
```

## Testing

```bash
# Run canonical tests
cd packages/lib
pnpm test canonical

# All tests
pnpm test
```

## Common Scenarios

### Remove tracking from current URL

```typescript
import { stripTrackingParams } from '@nearbybazaar/lib/canonical';

// Current: /page?utm_source=google&page=2
const clean = stripTrackingParams(window.location.href);
// Result: /page?page=2
```

### Check if URLs are duplicates

```typescript
import { areCanonicalDuplicates } from '@nearbybazaar/lib/canonical';

const isDupe = areCanonicalDuplicates(
  'https://example.com/page?utm_source=google',
  'https://example.com/page?utm_source=facebook',
);
// Returns: true (same canonical after stripping)
```

### Normalize URL

```typescript
import { normalizeUrl } from '@nearbybazaar/lib/canonical';

const normalized = normalizeUrl('HTTP://Example.COM/Path/?z=1&a=2');
// Returns: 'https://example.com/path?a=2&z=1'
```

## Troubleshooting

| Problem                      | Solution                                       |
| ---------------------------- | ---------------------------------------------- |
| No canonical tag in HTML     | Add `<SeoHead canonicalUrl={...} />`           |
| Tracking params in canonical | Use helper functions, don't construct manually |
| Wrong domain in canonical    | Set `NEXT_PUBLIC_BASE_URL` env variable        |
| Canonical tag duplicated     | Remove duplicate `SeoHead` components          |
| Case mismatch                | Use `lowercasePath: true` (default)            |

## Environment Setup

```env
# .env.local or .env
NEXT_PUBLIC_BASE_URL=https://nearbybazaar.com
```

## SEO Best Practices

✅ **DO:**

- Use absolute URLs with full domain
- Strip tracking parameters
- Be consistent with protocol/case
- Use on every page
- Point to preferred URL version

❌ **DON'T:**

- Use relative URLs (`/page` instead of `https://example.com/page`)
- Include tracking parameters
- Create circular canonicals
- Change canonical frequently
- Use across different domains

## Test Examples

```typescript
// Strip tracking parameters
expect(stripTrackingParams('https://example.com/page?utm_source=google&page=2')).toBe(
  'https://example.com/page?page=2',
);

// Product canonical
expect(getProductCanonical('https://example.com', 'laptop')).toBe('https://example.com/p/laptop');

// Category with pagination
expect(getCategoryCanonical('https://example.com', 'electronics', { page: 2 })).toBe(
  'https://example.com/category/electronics?page=2',
);

// Duplicate check
expect(
  areCanonicalDuplicates(
    'https://example.com/page?utm_source=google',
    'https://example.com/page?utm_source=facebook',
  ),
).toBe(true);
```

## Files Location

**Utilities:** `packages/lib/src/canonical.ts`  
**Tests:** `packages/lib/__tests__/canonical.test.ts`  
**SEO Service:** `apps/api/src/services/seo/generator.ts`  
**Component:** `apps/web/components/SeoHead.tsx`  
**Docs:** `docs/CANONICALS.md` (full guide)
Related: See `docs/SLUGS.md` for slug history and 301 redirects.

## Quick Stats

- **13** utility functions
- **62** tests (100% passing)
- **30+** tracking parameters handled
- **6** content types supported
- **<1ms** average processing time

---

**Need more details?** See full documentation at `docs/CANONICALS.md`
