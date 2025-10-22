# NearbyBazaar

A multi-tenant marketplace platform with admin panel, vendor dashboard, and public storefront.

## Architecture

- **Monorepo**: Multiple apps and shared packages managed with pnpm workspaces
- **Apps**:
  - `admin`: Admin dashboard (Next.js)
  - `api`: REST API server (Express + Mongoose)
  - `vendor`: Vendor dashboard (Next.js)
  - `web`: Public storefront (Next.js)
- **Packages**:
  - `lib`: Shared utilities (slug, SKU, pricing, watermarking)
  - `types`: Shared TypeScript types
  - `ui`: Shared UI components

## Setup

```powershell
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in development
pnpm dev
```

## Development Database Seeding

Seed sample data for development (idempotent, safe to re-run):

```powershell
# Seed everything (dev users/vendor/products/services + plans + dropship + agreements + optional kaizen)
pnpm --filter @nearbybazaar/api seed:all

# Individual seeders
pnpm --filter @nearbybazaar/api seed:dev         # Basic dev data (users, vendor, 3 products, 1 service)
pnpm --filter @nearbybazaar/api seed:plans       # Classified plans + sample vendor assignment
pnpm --filter @nearbybazaar/api seed:dropship    # 5 suppliers, 15 SKU mappings, 5 margin rules
pnpm --filter @nearbybazaar/api seed:agreements  # Vendor agreements data
pnpm --filter @nearbybazaar/api seed:kaizen      # Example Kaizen ideas/decisions (enable via SEED_KAIZEN_EXAMPLES=true)
```

Notes:

- Configure your Mongo connection via `apps/api/.env` (MONGODB_URI). Defaults to `mongodb://localhost:27017/nearbybazaar`.
- To run a local MongoDB/Redis stack quickly, see Docker docs and run: `docker compose up -d`.
- All seeders use upsert logic and will update existing records without creating duplicates.

**What gets seeded (Dropshipping)**:

- 5 sample suppliers (various statuses: active, pending, suspended)
- 15 SKU mappings across 3 active suppliers
- 5 margin rules (percent and fixed, various priorities)

See `apps/api/src/seeders/dropship.ts` for details.

## Features

- **Vendor Slugs**: URL-friendly slugs for vendor stores with collision handling and history (see [docs/VENDOR_SLUGS.md](./docs/VENDOR_SLUGS.md))
- **Pricing**: Dynamic pricing with plan-based features
- **Watermarking**: Image watermarking for classifieds
- **Forms**: Dynamic form builder and submission handling
- **Kaizen**: Continuous improvement idea tracking
- **Sponsored Advertising**: CPC/CPM campaigns with auction-based ad placements
- **Ad Management**: Vendor campaign dashboards and admin advertising analytics

## Documentation

- [Forms](./docs/FORMS.md)
- [Generators](./docs/GENERATORS.md)
- [Kaizen](./docs/KAIZEN.md)
- [Plans & Pricing](./docs/PLANS.md)
- [Watermarking](./docs/WATERMARKING.md)
- [Vendor Slugs](./docs/VENDOR_SLUGS.md)
- **Advertising & AdTech**:
  - [📘 Ad Management Dashboard](./docs/AD_MANAGEMENT_DASHBOARD.md) - Vendor campaign management & admin analytics
- **Dropshipping**:
  - [📘 Complete Guide](./docs/DROPSHIP.md) - Architecture, workflows, examples
  - [API Reference](./docs/DROPSHIP_API.md) - REST endpoints
  - [Testing Guide](./docs/DROPSHIP_TESTING.md) - Test suite documentation
  - [Quick Start Checklist](./docs/DROPSHIP_TESTING_CHECKLIST.md)
- **SEO**:
  - [📘 SEO API Guide](./docs/SEO_API.md) - Server SEO metadata API
  - [📘 Sitemap Guide](./docs/SITEMAP.md) - Dynamic sitemap generation
  - [Quick Reference](./docs/SITEMAP_QUICK_REFERENCE.md) - Sitemap cheat sheet
- **B2B & Invoicing**:
  - [📘 B2B Complete User Guide](./docs/B2B_USER_GUIDE.md) - **Master guide for all B2B features**
  - [📘 GST Invoicing](./docs/GST_INVOICING.md) - GST-compliant invoice generation
  - [Quick Reference](./docs/GST_INVOICING_QUICK_REFERENCE.md) - Invoice API cheat sheet
  - [📘 Payment Terms & Credit](./docs/PAYMENT_TERMS.md) - Bulk order payment terms & credit management
  - [Quick Reference](./docs/PAYMENT_TERMS_QUICK_REFERENCE.md) - Credit API cheat sheet
  - [📘 B2B Analytics & Reports](./docs/B2B_ANALYTICS.md) - Bulk sales analytics, regional/industry breakdowns
  - [Quick Reference](./docs/B2B_ANALYTICS_QUICK_REFERENCE.md) - Analytics API & metrics cheat sheet
  - [B2B Buyer Accounts](./docs/B2B_BUYER_ACCOUNTS.md) - Business accounts & wholesale
  - **User Guides**:
    - [📘 B2B Buyer Guide](./docs/B2B_BUYER_GUIDE.md) - Complete guide for B2B buyers
    - [📘 B2B Vendor Guide](./docs/B2B_VENDOR_GUIDE.md) - Complete guide for B2B vendors
    - [🎓 Vendor Training Materials](./docs/VENDOR_TRAINING.md) - Interactive B2B sales training

## Testing

```powershell
# Run all tests
pnpm test

# Run API tests (including dropshipping)
pnpm --filter @nearbybazaar/api test

# Run dropship tests specifically
pnpm --filter @nearbybazaar/api test dropship.spec.ts

# Run with coverage
pnpm --filter @nearbybazaar/api test --coverage
```

**Note**: Dropshipping tests are a critical CI gate. See [Testing Checklist](./docs/DROPSHIP_TESTING_CHECKLIST.md).

## License

Private/Proprietary

### Bot Protection: Google reCAPTCHA v3

NearbyBazaar uses Google reCAPTCHA v3 to protect critical forms (signup, inquiry, booking, RFQ, password reset) from bots and abuse.

**Setup:**

- Register your site at [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin/create)
- Add these keys to your `.env`:
  - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (frontend)
  - `RECAPTCHA_SECRET_KEY` (backend)

**How it works:**

- Frontend loads reCAPTCHA v3 script and gets a token on form submit
- Backend verifies token with Google API and only accepts if score is above threshold (default: 0.5)
- See docs/SECURITY.md for details

**Environment Example:**

```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
```
