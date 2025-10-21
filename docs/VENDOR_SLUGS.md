## Store Slug Implementation (Feature #111)

### Overview
Each vendor now has a unique, URL-friendly slug generated from the vendor's name. The slug is maintained with collision handling and history tracking for future SEO redirects.

### Changes
- **Vendor Model** (`apps/api/src/models/Vendor.ts`):
  - Added `slug` field (unique, indexed)
  - Added `slugHistory` array to track previous slugs
  - Added pre-validate hook to generate slug from name with collision detection
  - Automatically updates slug when vendor name changes and archives old slug to history

- **Migration** (`apps/api/src/migrations/vendor/001-add-vendor-slug.ts`):
  - Backfills slugs for existing vendors
  - Creates unique index on `slug` field
  - Handles duplicate names by appending numeric suffixes

- **Tests** (`apps/api/tests/vendor.slug.spec.ts`):
  - Validates unique slug generation
  - Tests collision handling (e.g., "acme-store-2")
  - Verifies slug history updates on name change

### Usage
```typescript
const vendor = await Vendor.create({
  name: 'Cool Shop',
  email: 'shop@example.com',
  owner: userId
});
// vendor.slug => 'cool-shop'

vendor.name = 'Cooler Shop';
await vendor.save();
// vendor.slug => 'cooler-shop'
// vendor.slugHistory => ['cool-shop']
```

### Future Work
- Implement 301 redirects for old store slugs (SEO chunk)
- Add slug-based vendor lookup routes
