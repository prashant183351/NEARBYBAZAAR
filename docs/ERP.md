# ERP Integration Documentation

## Overview

NearbyBazaar supports integration with external ERP systems via a flexible adapter interface. Vendors can export orders, sync inventory, and automate data flows securely.

## Data Flow

```
+-------------------+      +-------------------+      +-------------------+
| NearbyBazaar      |<---->| ERP Adapter       |<---->| External ERP      |
+-------------------+      +-------------------+      +-------------------+
      | Export Orders         | Map/Transform Data      | Import/Sync Data
      | Import Inventory      | Verify Webhooks         | Receive Updates
      | Manual/Auto Sync      | Encrypt Secrets         | Send/Receive Files
```

## Setting Up an Adapter

- Implement the `ERPConnector` interface in `apps/api/src/services/erp/types.ts`.
- Use built-in adapters (file, Tally stub) or create your own.
- Configure field mappings in the admin UI (`apps/admin/pages/erp/mapping.tsx`).
- Securely store ERP credentials using encryption (`apps/api/src/utils/crypto.ts`).

## Security Aspects

- **Secrets**: All ERP credentials are encrypted at rest using AES-GCM. Secrets are masked in the UI and never logged.
- **Webhooks**: Incoming ERP webhooks are verified using HMAC signatures. Duplicate events are ignored for idempotency.
- **Access Control**: Only authorized users can trigger manual syncs or access sensitive data.

## Features

## Sample Data Files

Sample ERP import/export files are available in `/samples/erp/` for testing and development:

- **orders_sample.csv** - Columns: `id`, `customer_name`, `customer_email`, `sku`, `quantity`, `total`, `created_at` - Example:
  `csv
          id,customer_name,customer_email,sku,quantity,total,created_at
          1,Alice,alice@example.com,SKU1,2,100,2025-10-19T10:00:00Z
          2,Bob,bob@example.com,SKU2,1,50,2025-10-19T11:00:00Z
          `

- **inventory_sample.csv** - Columns: `sku`, `quantity`, `updated_at` - Example:
  `csv
          sku,quantity,updated_at
          SKU1,10,2025-10-19T12:00:00Z
          SKU2,5,2025-10-19T12:05:00Z
          `

- **orders_sample.xlsx** / **inventory_sample.xlsx** - XLSX files with similar columns as above. Generate real XLSX files using the ERP export logic or Excel for testing.

Refer to these samples for adapter development, automated tests, and documentation examples.

## Flow Diagrams

_See above for a simple data flow. For more details, refer to the adapter and sync state models._

## Troubleshooting

- If sync fails, check error CSV for details.
- Ensure ERP credentials are set and valid.
- Verify webhook signatures if integration is not working.

---

_Last updated: October 2025_
