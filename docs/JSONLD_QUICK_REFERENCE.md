# JSON-LD Quick Reference

## Quick Start

```bash
# Import in your page
import { generateProductSchema } from '@nearbybazaar/lib/jsonld';
import { SeoHead } from '../../components/SeoHead';

# Generate schema
const schema = generateProductSchema({
  name: 'Product Name',
  price: 999,
  priceCurrency: 'INR',
});

# Pass to SeoHead
<SeoHead jsonLd={schema} />
```

## Schema Generators

### Product Schema
```typescript
generateProductSchema({
  name: string;          // Required
  price: number;         // Required
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued';
  description?: string;
  sku?: string;
  brand?: string;
  url?: string;
  image?: string | string[];
  seller?: { name: string; url?: string };
  aggregateRating?: { ratingValue: number; reviewCount: number };
});
```

### Service Schema
```typescript
generateServiceSchema({
  name: string;                              // Required
  provider: { name: string; url?: string };  // Required
  description?: string;
  areaServed?: string;
  offers?: { price: number; priceCurrency?: string };
  url?: string;
  image?: string | string[];
  aggregateRating?: { ratingValue: number; reviewCount: number };
});
```

### LocalBusiness Schema
```typescript
generateLocalBusinessSchema({
  name: string;          // Required
  description?: string;
  url?: string;
  telephone?: string;
  email?: string;
  image?: string | string[];
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  geo?: { latitude: number; longitude: number };
  priceRange?: string;   // e.g., '₹₹'
  aggregateRating?: { ratingValue: number; reviewCount: number };
  openingHours?: string[];  // e.g., ['Mo-Fr 09:00-18:00']
});
```

### Organization Schema
```typescript
generateOrganizationSchema({
  name: string;          // Required
  description?: string;
  url?: string;
  logo?: string;
  email?: string;
  telephone?: string;
  address?: { /* same as LocalBusiness */ };
  sameAs?: string[];     // Social media URLs
});
```

## Validation

```typescript
// Check before rendering
const errors = validateProductSchema(input);
if (errors.length > 0) {
  console.warn('Schema validation failed:', errors);
}
```

## Testing

```bash
# Run tests
cd packages/lib
pnpm test jsonld.test.ts

# Google Rich Results Test
# https://search.google.com/test/rich-results

# Schema.org Validator
# https://validator.schema.org/
```

## Common Patterns

### Product with Full Info
```typescript
const productSchema = generateProductSchema({
  name: product.name,
  description: product.description,
  sku: product.sku,
  brand: product.brand,
  price: product.price,
  priceCurrency: 'INR',
  availability: product.stock > 0 ? 'InStock' : 'OutOfStock',
  url: `${baseUrl}/p/${product.slug}`,
  image: product.images,
  seller: {
    name: vendor.name,
    url: `${baseUrl}/store/${vendor.slug}`,
  },
  aggregateRating: product.reviewCount > 0 ? {
    ratingValue: product.averageRating,
    reviewCount: product.reviewCount,
  } : undefined,
});
```

### Store with Location
```typescript
const businessSchema = generateLocalBusinessSchema({
  name: vendor.name,
  description: vendor.description,
  url: `${baseUrl}/store/${vendor.slug}`,
  telephone: vendor.phone,
  email: vendor.email,
  image: vendor.logoUrl,
  address: vendor.address ? {
    streetAddress: vendor.address.street,
    addressLocality: vendor.address.city,
    addressRegion: vendor.address.state,
    postalCode: vendor.address.postalCode,
    addressCountry: 'IN',
  } : undefined,
  geo: vendor.latitude && vendor.longitude ? {
    latitude: vendor.latitude,
    longitude: vendor.longitude,
  } : undefined,
  priceRange: '₹₹',
  aggregateRating: vendor.averageRating ? {
    ratingValue: vendor.averageRating,
    reviewCount: vendor.reviewCount || 0,
  } : undefined,
});
```

### Service with Provider
```typescript
const serviceSchema = generateServiceSchema({
  name: service.name,
  description: service.description,
  provider: {
    name: vendor.name,
    url: `${baseUrl}/store/${vendor.slug}`,
  },
  offers: service.price ? {
    price: service.price,
    priceCurrency: 'INR',
  } : undefined,
  areaServed: service.cities?.join(', '),
  url: `${baseUrl}/s/${service.slug}`,
  image: service.media?.[0],
  aggregateRating: service.averageRating ? {
    ratingValue: service.averageRating,
    reviewCount: service.reviewCount || 0,
  } : undefined,
});
```

## Best Practices

✅ **DO:**
- Use INR for all Indian prices
- Include real ratings (or omit if none)
- Provide high-res images (min 1200x800)
- Use absolute URLs (https://)
- Validate before production
- Keep data up-to-date

❌ **DON'T:**
- Fake ratings or reviews
- Use relative URLs
- Include broken image links
- Mix currencies
- Omit required fields
- Use invalid availability values

## Error Handling

```typescript
try {
  const schema = generateProductSchema(input);
  const errors = validateProductSchema(input);
  
  if (errors.length > 0) {
    // Log but don't block
    console.warn('Schema validation issues:', errors);
  }
  
  return <SeoHead jsonLd={schema} />;
} catch (error) {
  // Graceful degradation
  console.error('Schema generation failed:', error);
  return <SeoHead />; // Without schema
}
```

## Multiple Schemas

```typescript
// Pass array for multiple schemas on one page
<SeoHead
  jsonLd={[
    productSchema,
    organizationSchema,
  ]}
/>
```

## Performance Tips

- Generate schemas server-side (SSR/SSG)
- Cache frequently used schemas
- Use CDN for images
- Keep schemas under 10KB each
- Avoid deep nesting

## SEO Impact

- ⭐ Star ratings in results: ~30% CTR boost
- 💰 Price display: ~20% CTR increase
- 📍 Local results: Better visibility
- 🔍 Voice search: Enhanced compatibility

## Files Reference

- **Library**: `packages/lib/src/jsonld.ts`
- **Component**: `apps/web/components/SeoHead.tsx`
- **Tests**: `packages/lib/__tests__/jsonld.test.ts`
- **Docs**: `docs/JSONLD.md`
- **Examples**: `apps/web/pages/p/[slug].tsx`

## Support

- Full docs: `docs/JSONLD.md`
- Feature summary: `docs/FEATURE_155_SUMMARY.md`
- Tests: Run `pnpm test jsonld.test.ts`

---

**Quick Reference Version**: 1.0  
**Last Updated**: Feature #155 Implementation
