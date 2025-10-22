# Slug History & 301 Redirects

This document explains how NearbyBazaar tracks slug changes and issues SEO-friendly 301 redirects when content moves to a new slug.

## What is recorded

- For products, services, classifieds, and vendors, whenever the slug changes (e.g., due to a name change), a mapping is recorded:
  - type: product | service | classified | vendor
  - oldSlug: previous slug
  - newSlug: new/current slug
  - resourceId: optional reference to the document

Stored in: `apps/api/src/models/SlugHistory.ts`

## How redirects work

- API route: `GET /v1/slug/resolve/:type/:slug`
  - If a mapping exists (including through chained changes), responds `301` and `Location` header pointing to the public URL:
    - product -> `/p/{latest}`
    - service -> `/s/{latest}`
    - classified -> `/c/{latest}`
    - vendor -> `/store/{latest}`
  - If no mapping exists, responds `404`.

- Controllers also fallback:
  - `GET /v1/products/:slug` will 301 to `/p/{latest}` when the slug is old.
  - `GET /v1/services/slug/:slug` will 301 to `/s/{latest}`.
  - `GET /v1/classifieds/slug/:slug` will 301 to `/c/{latest}`.
  - `GET /v1/vendors/slug/:slug` will 301 to `/store/{latest}`.

## Loop prevention

- `resolveLatestSlug` limits depth (default 10) and tracks visited slugs to avoid infinite loops. If a loop is detected, it returns `null` and no redirect is performed.

## Model hooks

- Product, Service, Classified, Vendor models update slug history on slug changes using `recordSlugChange` during save/validate hooks.

## Testing

Run API tests for slug history behavior:

```powershell
# From repo root
pnpm -w --filter @nearbybazaar/api test -- slugHistory.spec.ts
```

Covers:

- Basic mapping
- Chained redirects
- Loop prevention
- 301 endpoint behavior

## Best practices

- Keep rendering canonical tags using the latest slug (see `docs/CANONICALS.md`).
- Avoid manual edits to SlugHistory; let hooks handle updates.
- Ensure public apps also handle 301 by consulting `/v1/slug/resolve` if needed.

# Slug History & 301 Redirects

This document explains how NearbyBazaar tracks slug changes and returns SEO-friendly 301 redirects.

## Overview

- We preserve old slugs whenever a resource slug changes (product, service, classified, vendor).
- On requests using an old slug, the API responds with a 301 redirect to the latest slug.
- We prevent infinite loops and cap chain depth.

## Data Model

- Model: `apps/api/src/models/SlugHistory.ts`
- Fields: `type` (product|service|classified|vendor), `resourceId`, `oldSlug`, `newSlug`, `updatedAt`.
- Unique index on `(type, oldSlug)` ensures a single mapping per old slug.

## Service

- `recordSlugChange({ type, resourceId, oldSlug, newSlug })` upserts a mapping.
- `resolveLatestSlug(type, slug, { maxDepth = 10 })` walks the chain safely.

## Integration Points

- Hooks on Product, Service, Classified, Vendor call `recordSlugChange` when slug changes.
- API controller for products falls back to slug history and returns 301 when appropriate.
- Generic resolver route: `GET /v1/slug/resolve/:type/:slug` responds with 301 if a mapping exists.

## Behavior

- No-ops if slug unchanged.
- Loop detection: If a cycle is encountered, resolution stops and returns `null`.
- Chain capping: Max 10 hops to avoid excessive DB reads.

## Extending

- For additional models with slugs, import and call `recordSlugChange` in save hooks.
- Add controller fallbacks similar to products for direct resource endpoints.

## Testing

- See `apps/api/tests/slugHistory.spec.ts` for resolver tests.
- Add integration tests per resource for controller 301 behavior.

## SEO Notes

- Combined with canonical tags, this prevents duplicate content and protects rankings after renames.
- Always return 301 (permanent) for slug migrations; do not use 302.
