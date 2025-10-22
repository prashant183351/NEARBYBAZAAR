## Vendor Storefront (Feature #112)

### Overview

The vendor storefront is a public-facing page that displays all products, services, and classifieds for a specific vendor. It includes SSR rendering, pagination, and SEO optimization.

### Features

- **Dynamic Routing**: Access stores via `/store/{vendor-slug}`
- **Tabbed Interface**: Switch between products, services, and classifieds
- **Pagination**: Navigate through vendor items with Previous/Next controls
- **SEO Optimized**: Vendor-specific meta tags, Open Graph, and Twitter Card support
- **Responsive Design**: Grid layout adapts to screen size
- **Fallback Data**: Sample data shown when API is unavailable

### File Structure

```
apps/web/
├── pages/
│   └── store/
│       └── [slug].tsx          # Main storefront page with SSR
├── components/
│   ├── StoreHeader.tsx         # Vendor header with logo & plan badge
│   ├── ItemGrid.tsx            # Responsive grid for items
│   └── SeoHead.tsx             # SEO meta tags (existing)
└── tests/
    └── store.spec.tsx          # SSR rendering tests

apps/api/
├── src/
│   └── routes/
│       ├── vendor.ts           # GET /v1/vendors/slug/:slug
│       └── public/
│           ├── products.ts     # Supports ?vendor=:id filter
│           ├── services.ts     # Supports ?vendor=:id filter
│           └── classifieds.ts  # Supports ?vendor=:id filter
```

### API Endpoints

#### Get Vendor by Slug

```
GET /v1/vendors/slug/:slug
Response: { _id, name, slug, email, logoUrl, planTier, description }
```

#### List Items by Vendor

```
GET /v1/products?vendor=:vendorId&page=1&limit=12
GET /v1/services?vendor=:vendorId&page=1&limit=12
GET /v1/classifieds?vendor=:vendorId&page=1&limit=12

Response: {
  items: [...],
  meta: { total, page, limit, totalPages }
}
```

### Usage Example

Access a vendor's store:

```
https://nearbybazaar.com/store/cool-shop
```

Navigate to different tabs:

```
/store/cool-shop?tab=services
/store/cool-shop?tab=classifieds
```

Pagination:

```
/store/cool-shop?tab=products&page=2
```

### SEO Implementation

Each store page includes:

- **Title**: `{Vendor Name} - Storefront | NearbyBazaar`
- **Description**: Vendor description or default message
- **Open Graph Tags**: Vendor name, description, logo
- **Twitter Card**: `summary_large_image`
- **Canonical URL**: Includes full store path

### Component Props

**StoreHeader**

```typescript
{
  name: string;
  description: string;
  planTier?: string;      // Shows ProBadge for Pro/Featured
  logoUrl?: string;       // Vendor logo (80x80)
}
```

**ItemGrid**

```typescript
{
  items: Array<{
    _id: string;
    name: string;
    slug: string;
    price?: number;
    currency?: string;
    description?: string;
    media?: string[];
  }>;
  type: 'products' | 'services' | 'classifieds';
}
```

### Future Enhancements

- Real-time inventory updates
- Filtering and sorting options
- Vendor contact/inquiry form
- Store statistics and analytics
- Custom vendor branding/themes
- Related items suggestions
