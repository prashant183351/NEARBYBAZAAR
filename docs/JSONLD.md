# JSON-LD Structured Data Guide

## Overview

This document describes the JSON-LD structured data implementation for NearbyBazaar (Feature #155). JSON-LD (JavaScript Object Notation for Linked Data) enables rich search results in Google, Bing, and other search engines by providing semantic markup using schema.org vocabulary.

## Implementation Status

✅ **Completed:**

- JSON-LD utility library (`packages/lib/src/jsonld.ts`)
- Product schema integration (product detail pages)
- Service schema integration (service detail pages)
- LocalBusiness schema integration (vendor store pages)
- Organization schema (available for use)
- SeoHead component enhancement
- Comprehensive test suite (20 tests)

## Schema Types Supported

### 1. Product Schema

Used for: Product detail pages (`/p/[slug]`)

**Required Fields:**

- `name` (string): Product name
- `price` (number): Price in smallest currency unit (e.g., INR paisa)

**Optional Fields:**

- `description` (string): Product description
- `sku` (string): Stock keeping unit
- `brand` (string): Brand name
- `priceCurrency` (string): Currency code (default: 'INR')
- `availability` ('InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued')
- `url` (string): Product URL
- `image` (string | string[]): Product images
- `seller` (object): Seller information
  - `name` (string): Seller name
  - `url` (string): Seller URL
- `aggregateRating` (object): Rating information
  - `ratingValue` (number): Average rating
  - `reviewCount` (number): Number of reviews

**Example:**

```typescript
import { generateProductSchema } from '@nearbybazaar/lib/jsonld';

const productSchema = generateProductSchema({
  name: 'iPhone 15 Pro',
  description: 'Latest iPhone with titanium design',
  sku: 'APPLE-iPhone-15-PRO-256GB',
  brand: 'Apple',
  price: 129900,
  priceCurrency: 'INR',
  availability: 'InStock',
  url: 'https://nearbybazaar.com/p/iphone-15-pro',
  image: ['https://cdn.nearbybazaar.com/products/iphone-15-pro-1.jpg'],
  seller: {
    name: 'Apple Store Mumbai',
    url: 'https://nearbybazaar.com/store/apple-store-mumbai',
  },
  aggregateRating: {
    ratingValue: 4.8,
    reviewCount: 245,
  },
});
```

### 2. Service Schema

Used for: Service detail pages (`/s/[slug]`)

**Required Fields:**

- `name` (string): Service name
- `provider` (object): Service provider
  - `name` (string): Provider name
  - `url` (string, optional): Provider URL

**Optional Fields:**

- `description` (string): Service description
- `areaServed` (string): Geographic area (e.g., "Mumbai, Navi Mumbai")
- `offers` (object): Pricing information
  - `price` (number): Service price
  - `priceCurrency` (string): Currency code
- `image` (string | string[]): Service images
- `url` (string): Service URL
- `aggregateRating` (object): Rating information

**Example:**

```typescript
import { generateServiceSchema } from '@nearbybazaar/lib/jsonld';

const serviceSchema = generateServiceSchema({
  name: 'Home Cleaning Service',
  description: 'Professional home cleaning with eco-friendly products',
  provider: {
    name: 'CleanPro Mumbai',
    url: 'https://nearbybazaar.com/store/cleanpro-mumbai',
  },
  offers: {
    price: 1500,
    priceCurrency: 'INR',
  },
  areaServed: 'Mumbai, Navi Mumbai, Thane',
  url: 'https://nearbybazaar.com/s/home-cleaning',
  aggregateRating: {
    ratingValue: 4.5,
    reviewCount: 128,
  },
});
```

### 3. LocalBusiness Schema

Used for: Vendor store pages (`/store/[slug]`)

**Required Fields:**

- `name` (string): Business name

**Optional Fields:**

- `description` (string): Business description
- `url` (string): Business URL
- `telephone` (string): Phone number
- `email` (string): Email address
- `image` (string | string[]): Business images/logo
- `address` (object): Physical address
  - `streetAddress` (string): Street address
  - `addressLocality` (string): City
  - `addressRegion` (string): State
  - `postalCode` (string): Postal code
  - `addressCountry` (string): Country code (e.g., 'IN')
- `geo` (object): Geographic coordinates
  - `latitude` (number): Latitude
  - `longitude` (number): Longitude
- `priceRange` (string): Price range indicator (e.g., '₹₹')
- `aggregateRating` (object): Rating information
- `openingHours` (string[]): Opening hours (e.g., ['Mo-Fr 09:00-18:00'])

**Example:**

```typescript
import { generateLocalBusinessSchema } from '@nearbybazaar/lib/jsonld';

const businessSchema = generateLocalBusinessSchema({
  name: 'ABC Electronics',
  description: 'Premium electronics store in Mumbai',
  url: 'https://nearbybazaar.com/store/abc-electronics',
  telephone: '+91-22-12345678',
  email: 'contact@abcelectronics.com',
  image: 'https://cdn.nearbybazaar.com/vendors/abc-electronics-logo.jpg',
  address: {
    streetAddress: '123 MG Road',
    addressLocality: 'Mumbai',
    addressRegion: 'Maharashtra',
    postalCode: '400001',
    addressCountry: 'IN',
  },
  geo: {
    latitude: 19.076,
    longitude: 72.8777,
  },
  priceRange: '₹₹₹',
  aggregateRating: {
    ratingValue: 4.6,
    reviewCount: 312,
  },
  openingHours: ['Mo-Sa 10:00-20:00', 'Su 11:00-18:00'],
});
```

### 4. Organization Schema

Used for: General organization/company pages

**Required Fields:**

- `name` (string): Organization name

**Optional Fields:**

- `description` (string): Organization description
- `url` (string): Website URL
- `logo` (string): Logo URL
- `email` (string): Contact email
- `telephone` (string): Contact phone
- `address` (object): Address (same structure as LocalBusiness)
- `sameAs` (string[]): Social media profile URLs

**Example:**

```typescript
import { generateOrganizationSchema } from '@nearbybazaar/lib/jsonld';

const orgSchema = generateOrganizationSchema({
  name: 'NearbyBazaar',
  description: "India's hyperlocal e-commerce platform",
  url: 'https://nearbybazaar.com',
  logo: 'https://nearbybazaar.com/logo.png',
  email: 'support@nearbybazaar.com',
  sameAs: [
    'https://facebook.com/nearbybazaar',
    'https://twitter.com/nearbybazaar',
    'https://instagram.com/nearbybazaar',
    'https://linkedin.com/company/nearbybazaar',
  ],
});
```

## Integration with Pages

### Using in Next.js Pages

The `SeoHead` component has been enhanced to accept JSON-LD data:

```typescript
import { SeoHead } from '../../components/SeoHead';
import { generateProductSchema } from '@nearbybazaar/lib/jsonld';

export default function ProductPage({ product }) {
  const productSchema = generateProductSchema({
    name: product.name,
    price: product.price,
    priceCurrency: 'INR',
    // ... other fields
  });

  return (
    <>
      <SeoHead
        title={product.name}
        description={product.description}
        jsonLd={productSchema} // 👈 Pass the schema here
      />
      {/* Page content */}
    </>
  );
}
```

### Multiple Schemas

You can pass multiple schemas as an array:

```typescript
<SeoHead
  title="Store Name"
  jsonLd={[businessSchema, organizationSchema]}
/>
```

## Validation

Validation functions are provided to check schema completeness:

```typescript
import {
  validateProductSchema,
  validateServiceSchema,
  validateLocalBusinessSchema,
} from '@nearbybazaar/lib/jsonld';

// Returns an array of error messages (empty if valid)
const errors = validateProductSchema({
  name: 'Product',
  price: 100,
});

if (errors.length > 0) {
  console.error('Schema validation failed:', errors);
}
```

## Testing Your Implementation

### 1. Google Rich Results Test

Use Google's official testing tool:

1. Visit: https://search.google.com/test/rich-results
2. Enter your page URL or paste the HTML
3. Review any errors or warnings
4. Check the preview of how it will appear in search results

### 2. Schema Markup Validator

Use schema.org's validator:

1. Visit: https://validator.schema.org/
2. Paste your JSON-LD code
3. Review validation results

### 3. Local Testing

```bash
# Run JSON-LD tests
cd packages/lib
pnpm test jsonld.test.ts

# All 20 tests should pass
```

### 4. Browser DevTools

Inspect the rendered page and look for `<script type="application/ld+json">` tags in the `<head>`.

## Best Practices

### 1. Currency Formatting

Always use INR for Indian prices:

```typescript
price: 999,           // ₹999
priceCurrency: 'INR'
```

### 2. Availability Status

Use proper schema.org values:

- `'InStock'` → Products available now
- `'OutOfStock'` → Temporarily unavailable
- `'PreOrder'` → Available for pre-order
- `'Discontinued'` → No longer available

### 3. Image URLs

- Use absolute URLs (https://)
- Prefer high-resolution images (minimum 1200x800px)
- Use proper alt text elsewhere
- Consider multiple images for better results

### 4. Ratings

- Only include `aggregateRating` if you have real user reviews
- `ratingValue` should be the average (e.g., 4.5)
- `reviewCount` must match actual review count
- Don't fake ratings - search engines can detect this

### 5. Geographic Data

For LocalBusiness, include:

- Full address for better local SEO
- Accurate geo coordinates
- Local phone number format (+91 for India)

## Common Pitfalls

### ❌ Don't Do This:

```typescript
// Wrong: Missing required fields
generateProductSchema({
  name: 'Product'
  // Missing price!
});

// Wrong: Invalid availability
generateProductSchema({
  name: 'Product',
  price: 100,
  availability: 'yes' // Should be 'InStock'
});

// Wrong: Fake ratings
aggregateRating: {
  ratingValue: 5.0,
  reviewCount: 999999 // Unrealistic
}
```

### ✅ Do This Instead:

```typescript
// Correct: All required fields
generateProductSchema({
  name: 'Product',
  price: 100,
  priceCurrency: 'INR',
  availability: 'InStock',
});

// Correct: Real ratings or omit if none
aggregateRating: productReviews.length > 0
  ? {
      ratingValue: calculateAverage(productReviews),
      reviewCount: productReviews.length,
    }
  : undefined;
```

## Troubleshooting

### Schema Not Appearing in Search Results

1. **Wait Time**: It can take 1-2 weeks for Google to process
2. **Coverage**: Not all pages qualify for rich results
3. **Validation**: Use testing tools above to check for errors
4. **Robots.txt**: Ensure pages aren't blocked

### Validation Errors

```typescript
// Check validation before rendering
const errors = validateProductSchema(input);
if (errors.length > 0) {
  console.warn('Schema validation failed:', errors);
  // Either fix the data or omit the schema
  return null;
}
```

### TypeScript Errors

Make sure interfaces are imported:

```typescript
import type { ProductSchemaInput } from '@nearbybazaar/lib/jsonld';
```

## Performance Considerations

- JSON-LD generation is lightweight (< 1ms typically)
- Schemas are rendered server-side (no client-side overhead)
- Gzip compression reduces payload size significantly
- Consider caching schemas for frequently accessed pages

## SEO Impact

Implementing proper JSON-LD can result in:

- ⭐ Star ratings in search results
- 💰 Price display in search results
- 📍 Local business information panels
- 🔍 Improved search result appearance
- 📈 Higher click-through rates (up to 30% improvement)

## Future Enhancements

Potential additions in future phases:

- FAQ schema
- BreadcrumbList schema
- Review schema (individual reviews)
- Event schema (for bookings)
- Video schema (for product videos)

## Related Documentation

- **Feature #154**: [Slug History & 301 Redirects](./SLUGS.md)
- **Feature #151**: [Server SEO API](./SEO_API.md)
- **Feature #152**: [Sitemaps & Robots.txt](./SITEMAPS.md)
- **Feature #153**: [Canonical URLs](./CANONICALS.md)

## References

- [Schema.org Documentation](https://schema.org/)
- [Google Rich Results Guide](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [JSON-LD Specification](https://json-ld.org/)

---

**Last Updated**: Feature #155 Implementation (January 2025)
**Test Coverage**: 20 tests, 100% passing
**Files**: 7 implementation files, 3 page integrations, 1 test suite
