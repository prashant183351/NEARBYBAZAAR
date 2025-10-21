# Dropshipping API Endpoints

## Overview
RESTful API endpoints for the dropshipping module with Zod validation and RBAC protection.

**Base Path:** `/api/dropship`

**Authentication:** All endpoints require authentication via middleware that sets `req.user`.

**RBAC Rules:**
- **Vendors**: Can only access/modify their own resources
- **Admins**: Can access/modify all resources
- **Suppliers**: (Future) Can access assigned resources

## Endpoints

### Module Overview

#### GET /api/dropship
Get dropship module overview and statistics.

**Auth:** Vendor, Admin

**Response:**
```json
{
  "stats": {
    "suppliers": {
      "total": 10,
      "active": 8,
      "pending": 2
    },
    "mappings": {
      "total": 150,
      "active": 145
    },
    "marginRules": {
      "total": 5,
      "active": 5
    },
    "recentSyncs": []
  }
}
```

---

## Suppliers (`/api/dropship/suppliers`)

### POST /api/dropship/suppliers
Create a new supplier.

**Auth:** Vendor, Admin

**Request Body:**
```json
{
  "companyName": "Acme Corp",
  "contactPerson": "John Doe",
  "email": "john@acme.com",
  "phone": "+911234567890",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "zipCode": "400001"
  },
  "apiEndpoint": "https://api.acme.com/v1",
  "apiKey": "secret_key_here",
  "webhookSecret": "webhook_secret",
  "syncSchedule": "0 */6 * * *",
  "bankDetails": {
    "accountName": "Acme Corp",
    "accountNumber": "1234567890",
    "bankName": "HDFC Bank",
    "ifscCode": "HDFC0001234"
  },
  "taxInfo": {
    "gstNumber": "27AAAAA0000A1Z5",
    "panNumber": "AAAAA0000A"
  }
}
```

**Response:** `201 Created`
```json
{
  "supplier": {
    "_id": "...",
    "vendorId": "...",
    "companyName": "Acme Corp",
    "status": "pending",
    ...
  }
}
```

### GET /api/dropship/suppliers
List suppliers with filtering and pagination.

**Auth:** Vendor, Admin

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string): Filter by status
- `search` (string): Search by company name, contact, or email

**Response:**
```json
{
  "suppliers": [...],
  "total": 50,
  "page": 1,
  "limit": 20,
  "pages": 3
}
```

### GET /api/dropship/suppliers/:id
Get supplier details.

**Auth:** Vendor (own only), Admin

**Response:**
```json
{
  "supplier": {
    "_id": "...",
    "companyName": "Acme Corp",
    ...
  }
}
```

### PUT /api/dropship/suppliers/:id
Update supplier details.

**Auth:** Vendor (own only), Admin

**Request Body:** Same as POST, all fields optional

**Response:**
```json
{
  "supplier": { ... }
}
```

### PUT /api/dropship/suppliers/:id/status
Update supplier status (approval/rejection).

**Auth:** Admin (for active/suspended), Vendor (for other statuses)

**Request Body:**
```json
{
  "status": "active"
}
```

**Response:**
```json
{
  "supplier": { ... }
}
```

### DELETE /api/dropship/suppliers/:id
Deactivate a supplier (soft delete).

**Auth:** Vendor (own only), Admin

**Response:**
```json
{
  "message": "Supplier deactivated successfully"
}
```

### GET /api/dropship/suppliers/:id/stats
Get supplier statistics.

**Auth:** Vendor (own only), Admin

**Response:**
```json
{
  "stats": {
    "totalOrders": 150,
    "totalRevenue": 125000,
    "averageOrderValue": 833.33,
    "productCount": 50,
    "activeProducts": 48,
    "lastSyncAt": "2025-10-20T10:00:00Z"
  }
}
```

---

## SKU Mappings (`/api/dropship/mappings`)

### POST /api/dropship/mappings
Create a new SKU mapping.

**Auth:** Vendor, Admin

**Request Body:**
```json
{
  "supplierId": "...",
  "supplierSku": "ACM-001",
  "ourSku": "NB-ACM-001",
  "productId": "...",
  "mapping": {
    "productId": "...",
    "variantId": "...",
    "priceMultiplier": 1.2
  },
  "notes": "Optional notes"
}
```

**Response:** `201 Created`
```json
{
  "mapping": {
    "_id": "...",
    "vendorId": "...",
    "supplierId": "...",
    "supplierSku": "ACM-001",
    "ourSku": "NB-ACM-001",
    ...
  }
}
```

**Error:** `409 Conflict` if mapping already exists

### POST /api/dropship/mappings/bulk
Create multiple SKU mappings at once.

**Auth:** Vendor, Admin

**Request Body:**
```json
{
  "supplierId": "...",
  "mappings": [
    {
      "supplierSku": "ACM-001",
      "ourSku": "NB-ACM-001",
      "productId": "..."
    },
    {
      "supplierSku": "ACM-002",
      "ourSku": "NB-ACM-002",
      "productId": "..."
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "created": [...],
  "skipped": [
    { "supplierSku": "ACM-001", "reason": "Already exists" }
  ],
  "errors": [
    { "supplierSku": "ACM-999", "error": "Product not found" }
  ]
}
```

### GET /api/dropship/mappings
List SKU mappings with filtering.

**Auth:** Vendor (own only), Admin

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `supplierId` (string): Filter by supplier
- `status` (string): Filter by status
- `search` (string): Search by SKU

**Response:**
```json
{
  "mappings": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5
}
```

### GET /api/dropship/mappings/:id
Get mapping details.

**Auth:** Vendor (own only), Admin

**Response:**
```json
{
  "mapping": { ... }
}
```

### PUT /api/dropship/mappings/:id
Update an existing SKU mapping.

**Auth:** Vendor (own only), Admin

**Request Body:** Same as POST (except supplierId, supplierSku), all fields optional

**Response:**
```json
{
  "mapping": { ... }
}
```

### DELETE /api/dropship/mappings/:id
Deactivate a SKU mapping.

**Auth:** Vendor (own only), Admin

**Response:**
```json
{
  "message": "Mapping deactivated successfully"
}
```

### GET /api/dropship/mappings/resolve/:supplierSku
Resolve a supplier SKU to internal SKU.

**Auth:** Vendor, Admin

**Query Parameters:**
- `supplierId` (string, required): Supplier ID

**Response:**
```json
{
  "mapping": {
    "supplierSku": "ACM-001",
    "ourSku": "NB-ACM-001",
    "productId": { ... },
    ...
  }
}
```

**Error:** `404 Not Found` if mapping doesn't exist

---

## Margin Rules (`/api/dropship/margin-rules`)

### POST /api/dropship/margin-rules
Create a new margin rule.

**Auth:** Vendor, Admin

**Request Body:**
```json
{
  "supplierId": "...",  // OR
  "category": "electronics",
  "marginType": "percent",
  "value": 20
}
```

**Validation:** Either `supplierId` or `category` must be provided.

**Response:** `201 Created`
```json
{
  "rule": {
    "_id": "...",
    "vendorId": "...",
    "marginType": "percent",
    "value": 20,
    "active": true
  }
}
```

**Error:** `409 Conflict` if rule already exists for same criteria

### GET /api/dropship/margin-rules
List margin rules.

**Auth:** Vendor (own only), Admin

**Query Parameters:**
- `supplierId` (string): Filter by supplier
- `category` (string): Filter by category
- `active` (string, default: 'true'): 'true', 'false', or 'all'

**Response:**
```json
{
  "rules": [...]
}
```

### GET /api/dropship/margin-rules/:id
Get margin rule details.

**Auth:** Vendor (own only), Admin

**Response:**
```json
{
  "rule": { ... }
}
```

### PUT /api/dropship/margin-rules/:id
Update a margin rule.

**Auth:** Vendor (own only), Admin

**Request Body:** Same as POST, all fields optional

**Response:**
```json
{
  "rule": { ... }
}
```

### DELETE /api/dropship/margin-rules/:id
Deactivate a margin rule.

**Auth:** Vendor (own only), Admin

**Response:**
```json
{
  "message": "Margin rule deactivated successfully"
}
```

### POST /api/dropship/margin-rules/calculate
Calculate price with margin applied.

**Auth:** Vendor, Admin

**Request Body:**
```json
{
  "cost": 100,
  "supplierId": "...",
  "category": "electronics"
}
```

**Response:**
```json
{
  "cost": 100,
  "price": 120,
  "marginType": "percent",
  "marginValue": 20
}
```

**Logic:** 
- First tries to find rule by `supplierId`
- Then tries to find rule by `category`
- If no rule found, returns cost as-is

---

## Sync Management (`/api/dropship/sync`)

### POST /api/dropship/sync/trigger
Manually trigger a supplier sync job.

**Auth:** Vendor, Admin

**Request Body:**
```json
{
  "supplierId": "...",
  "syncType": "full"  // or "delta", "prices_only", "stock_only"
}
```

**Response:** `202 Accepted`
```json
{
  "message": "Sync job queued successfully",
  "jobId": "sync-1729410000000",
  "supplierId": "...",
  "syncType": "full"
}
```

### GET /api/dropship/sync/status/:jobId
Get status of a sync job.

**Auth:** Vendor, Admin

**Response:**
```json
{
  "jobId": "sync-1729410000000",
  "status": "completed",  // or "queued", "running", "failed"
  "progress": 100,
  "stats": {
    "productsProcessed": 150,
    "productsUpdated": 45,
    "productsFailed": 5,
    "duration": 12000
  }
}
```

### GET /api/dropship/sync/history
Get sync history.

**Auth:** Vendor, Admin

**Query Parameters:**
- `supplierId` (string, required for vendors)
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response:**
```json
{
  "history": [...],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

### GET /api/dropship/sync/schedule/:supplierId
Get sync schedule for a supplier.

**Auth:** Vendor (own only), Admin

**Response:**
```json
{
  "supplierId": "...",
  "schedule": "every 6 hours",
  "enabled": true,
  "lastSync": "2025-10-20T10:00:00Z",
  "nextSync": "2025-10-20T16:00:00Z"
}
```

### PUT /api/dropship/sync/schedule/:supplierId
Update sync schedule.

**Auth:** Vendor (own only), Admin

**Request Body:**
```json
{
  "schedule": "0 */4 * * *",  // Cron expression
  "enabled": true
}
```

**Response:**
```json
{
  "supplierId": "...",
  "schedule": "0 */4 * * *",
  "enabled": true,
  "message": "Schedule updated successfully"
}
```

---

## Error Responses

All endpoints use consistent error responses:

### 400 Bad Request (Validation Error)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["email"],
      "message": "Valid email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

or

```json
{
  "error": "Forbidden: Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Supplier not found"
}
```

### 409 Conflict
```json
{
  "error": "Mapping already exists",
  "existing": { ... },
  "message": "Use PUT to update existing mapping"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error message"
}
```

---

## RBAC Summary

| Endpoint | Vendor | Admin | Supplier |
|----------|--------|-------|----------|
| POST /suppliers | ✓ (own) | ✓ | ✗ |
| GET /suppliers | ✓ (own) | ✓ | ✗ |
| PUT /suppliers/:id | ✓ (own) | ✓ | ✗ |
| PUT /suppliers/:id/status | ✗* | ✓ | ✗ |
| DELETE /suppliers/:id | ✓ (own) | ✓ | ✗ |
| POST /mappings | ✓ (own) | ✓ | ✗ |
| GET /mappings | ✓ (own) | ✓ | ✗ |
| PUT /mappings/:id | ✓ (own) | ✓ | ✗ |
| DELETE /mappings/:id | ✓ (own) | ✓ | ✗ |
| POST /margin-rules | ✓ (own) | ✓ | ✗ |
| GET /margin-rules | ✓ (own) | ✓ | ✗ |
| POST /sync/trigger | ✓ (own) | ✓ | ✗ |
| GET /sync/status | ✓ | ✓ | ✗ |

\* Vendors can set other statuses, but only admins can set 'active' or 'suspended'

---

## OpenAPI Specification

See `openapi/dropship.yaml` for complete OpenAPI 3.0 specification.

TODO: Generate OpenAPI spec from these endpoints.

---

## Integration Example

```typescript
// Create a supplier
const supplier = await fetch('/api/dropship/suppliers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyName: 'Acme Corp',
    contactPerson: 'John Doe',
    email: 'john@acme.com',
    phone: '+911234567890',
  }),
});

// Create SKU mappings
const mappings = await fetch('/api/dropship/mappings/bulk', {
  method: 'POST',
  body: JSON.stringify({
    supplierId: supplier._id,
    mappings: [
      { supplierSku: 'ACM-001', ourSku: 'NB-001', productId: '...' },
      { supplierSku: 'ACM-002', ourSku: 'NB-002', productId: '...' },
    ],
  }),
});

// Set margin rule
const rule = await fetch('/api/dropship/margin-rules', {
  method: 'POST',
  body: JSON.stringify({
    supplierId: supplier._id,
    marginType: 'percent',
    value: 20,
  }),
});

// Trigger sync
const sync = await fetch('/api/dropship/sync/trigger', {
  method: 'POST',
  body: JSON.stringify({
    supplierId: supplier._id,
    syncType: 'full',
  }),
});
```
