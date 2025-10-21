# NearbyBazaar Generator Features Documentation

This document provides developer documentation for generator-related features in the NearbyBazaar platform, including bulk import, admin overrides, and public API endpoints. Keep this file updated as features evolve.

---

## Bulk Import (CSV)

Bulk import allows admins to upload CSV files to create or update products, services, or classifieds in bulk.

### Endpoint

```
POST /api/import/:type
```
- `:type` can be `products`, `services`, or `classifieds`.
- Requires authentication and admin privileges.
- Accepts `multipart/form-data` with a `file` field containing the CSV.

### Example cURL

```sh
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@products.csv" \
  http://localhost:4000/api/import/products
```

### CSV Format
- The CSV should have headers matching the model fields (e.g., `name`, `price`, `category`, etc.).
- Invalid rows will be skipped with errors reported in the response.

---

## Admin Overrides

Admin override endpoints allow privileged users to update slugs, SEO fields, and other protected properties directly.

### Endpoint

```
POST /api/admin/overrides/:model/:id
```
- `:model` can be `product`, `service`, or `classified`.
- Requires authentication and admin privileges.
- Accepts JSON body with fields to override (e.g., `{ "slug": "new-slug" }`).

### Example cURL

```sh
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"slug": "new-slug"}' \
  http://localhost:4000/api/admin/overrides/product/1234567890abcdef
```

---

## Public API Endpoints

Read-only, public endpoints for products, services, and classifieds. Support filtering, pagination, and cache headers.

### Endpoints

- `GET /api/public/products`
- `GET /api/public/services`
- `GET /api/public/classifieds`

#### Query Parameters
- `q`: Search term (applies to name/title fields)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

#### Example cURL

```sh
curl "http://localhost:4000/api/public/products?q=shoes&page=2&limit=10"
```

#### Response
```json
{
  "products": [ ... ],
  "total": 123,
  "page": 2,
  "limit": 10
}
```

---

## Notes
- All endpoints return standard error responses on failure.
- Bulk import and admin override endpoints require authentication and admin role.
- Public endpoints are read-only and cacheable (with ETag and Cache-Control headers).

---

_Last updated: 2025-10-19_
