# Dropshipping Quick Reference Card

## 🚀 Quick Start

```bash
# View main documentation
open docs/DROPSHIP.md

# Run tests
pnpm --filter @nearbybazaar/api test dropship.spec.ts

# Start API server
pnpm --filter @nearbybazaar/api dev
```

---

## 📊 Order Flow (30 seconds)

```
Customer → Platform → SKU Mapping → Margin Rule → Supplier API
                                                        ↓
Customer ← Platform ← Webhook    ← Supplier Fulfillment
```

---

## 🔑 Key Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Push order | POST | Supplier's `/api/orders` |
| Get stock | GET | Supplier's `/api/inventory/{sku}` |
| Get price | GET | Supplier's `/api/pricing/{sku}` |
| List suppliers | GET | `/api/dropship/suppliers` |
| Create mapping | POST | `/api/dropship/mappings` |
| Calculate price | POST | `/api/dropship/margin-rules/calculate-price` |

---

## 📦 Order Push Payload (Minimal)

```json
{
  "orderId": "ORD-12345",
  "items": [{
    "sku": "SUP-SKU-001",
    "quantity": 2,
    "unitPrice": 29.99
  }],
  "customer": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "address": {
      "line1": "123 Main St",
      "city": "NYC",
      "state": "NY",
      "postalCode": "10001"
    }
  },
  "total": 59.98
}
```

**Headers**:
```http
Content-Type: application/json
X-Idempotency-Key: order:ORD-12345:supplier:SUP-001
Authorization: Bearer {api_key}
```

---

## 📥 Webhook: Order Shipped (From Supplier)

```json
{
  "event": "order.shipped",
  "platformOrderId": "ORD-12345",
  "data": {
    "status": "shipped",
    "trackingNumber": "1234567890",
    "carrier": "FedEx",
    "estimatedDeliveryDate": "2025-10-25"
  }
}
```

---

## 💰 Margin Calculation

```typescript
// Percent margin (25%)
sellingPrice = cost * (1 + marginPercent / 100)
// Example: $100 * 1.25 = $125

// Fixed margin ($10)
sellingPrice = cost + marginFixed
// Example: $100 + $10 = $110
```

---

## 🔍 SKU Mapping

```typescript
{
  supplierSku: "SUP-WIDGET-001",  // What supplier uses
  ourSku: "NB-WIDGET-001",        // What we use
  supplierId: "sup_123",
  vendorId: "vendor_456"
}
```

**Lookup flow**:
1. Customer orders `NB-WIDGET-001`
2. System finds mapping: `SUP-WIDGET-001`
3. Send to supplier with `SUP-WIDGET-001`

---

## 🏥 Health Checks

```bash
# Check supplier active
curl http://localhost:3000/api/dropship/suppliers/:id

# Check SKU mapping exists
curl http://localhost:3000/api/dropship/mappings?ourSku=NB-WIDGET-001

# Check recent failed jobs
curl http://localhost:3000/api/dropship/sync/history?status=failed
```

---

## 🐛 Debug Commands

```bash
# Manually trigger stock sync
curl -X POST http://localhost:3000/api/dropship/sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"jobType": "stock-sync"}'

# Check sync job status
curl http://localhost:3000/api/dropship/sync/status/:jobId

# Calculate price with margins
curl -X POST http://localhost:3000/api/dropship/margin-rules/calculate-price \
  -d '{"vendorId": "v1", "cost": 100, "category": "electronics"}'
```

---

## ⚠️ Common Errors

| Code | Meaning | Fix |
|------|---------|-----|
| `SUPPLIER_INACTIVE` | Supplier not active | Activate supplier |
| `SKU_NOT_MAPPED` | No mapping found | Create SKU mapping |
| `INSUFFICIENT_INVENTORY` | Out of stock | Wait or find alternative |
| `API_TIMEOUT` | Supplier slow | Retry or check status |

---

## 📈 Key Metrics

Monitor these:
- Order push success rate (target: >95%)
- Stock sync frequency (target: <15 min lag)
- API response time (target: <2 seconds)
- Failed sync jobs (alert: >10/hour)

---

## 🔐 Security

```typescript
// Verify webhook signature
import crypto from 'crypto';

const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
hmac.update(requestBody);
const expectedSig = `sha256=${hmac.digest('hex')}`;

if (expectedSig !== receivedSignature) {
  throw new Error('Invalid signature');
}
```

---

## 📚 Documentation

- **Full Guide**: [docs/DROPSHIP.md](./DROPSHIP.md)
- **API Reference**: [docs/DROPSHIP_API.md](./DROPSHIP_API.md)
- **Testing**: [docs/DROPSHIP_TESTING.md](./DROPSHIP_TESTING.md)

---

## 🎯 Testing

```bash
# Run all dropship tests (37 tests)
pnpm --filter @nearbybazaar/api test dropship.spec.ts

# Single test
pnpm test -- -t "should push order to supplier"

# With coverage (must be >90%)
pnpm test --coverage
```

---

## 🔧 Configuration

**Environment Variables**:
```bash
SUPPLIER_API_TIMEOUT=10000      # 10 seconds
STOCK_SYNC_INTERVAL=900000      # 15 minutes
ENABLE_AUTO_DROPSHIP=true       # Auto-push orders
ENABLE_RATE_LIMITING=true       # Enable rate limiting
WEBHOOK_SECRET=your_secret_here # For signatures
REDIS_HOST=localhost            # Redis for rate limiting
REDIS_PORT=6379                 # Redis port
```

**Rate Limit Tiers**:
```
conservative: 30 requests/minute  (strict suppliers)
default:      60 requests/minute  (standard)
premium:     120 requests/minute  (high-volume)
```

---

## 🚨 Emergency Procedures

### Order Not Going to Supplier
1. Check supplier status: `GET /api/dropship/suppliers/:id`
2. Check SKU mapping: `GET /api/dropship/mappings?ourSku=...`
3. Check sync jobs: `GET /api/dropship/sync/history?status=failed`
4. Check retry queue: May be rate limited, will retry automatically
5. Manually trigger: `POST /api/dropship/sync/trigger`

### Rate Limited Errors
1. Check queue length: Monitor retry queue size
2. Verify rate limit tier: May need to upgrade to `premium`
3. Process retry queue: Ensure cron job is running
4. Reset rate limit: Admin-only if truly needed
5. Contact supplier: Request higher rate limits

### Stock Showing Zero
1. Check last sync time
2. Manually trigger: `POST /api/dropship/sync/trigger`
3. Query supplier directly: `GET supplier.com/api/inventory/{sku}`
4. Check API credentials

### Wrong Price Displayed
1. Check margin rules: `GET /api/dropship/margin-rules`
2. Test calculation: `POST /api/dropship/margin-rules/calculate-price`
3. Verify latest supplier cost synced
4. Check rule priority (category > supplier > vendor)

---

## 💡 Pro Tips

1. **Idempotency**: Always use unique idempotency keys for order pushes
2. **Retries**: Implement exponential backoff for failed API calls
3. **Monitoring**: Set up alerts for >5% failure rate
4. **Testing**: Use mock suppliers in development
5. **Logging**: Log all SyncJobs for audit trail
6. **Validation**: Validate webhooks with signature verification
7. **Rate Limiting**: Start with `default` tier, upgrade based on volume
8. **Fairness**: Each supplier has isolated rate limits (one won't block others)
9. **Retry Queue**: Process queues every 30-60 seconds for optimal throughput

---

## 📞 Support

- **Docs**: Start with [DROPSHIP.md](./DROPSHIP.md)
- **Issues**: Check GitHub Issues
- **Tests**: Run test suite for examples
- **Email**: dropship-support@nearbybazaar.com

---

**Last Updated**: October 20, 2025  
**Version**: 1.0.0  
**Print this**: Keep at your desk for quick reference!
