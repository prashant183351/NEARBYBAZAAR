# Shipping Integrations Documentation

## Overview

The NearbyBazaar shipping module provides a unified, pluggable interface for integrating with multiple courier and logistics providers across India. Built with extensibility in mind, it currently supports two major shipping providers—Shiprocket and Delhivery—while making it easy to add new providers as needed.

## Architecture

### Design Pattern: Adapter Pattern

The shipping module implements the **Adapter Pattern** to provide a consistent interface across different shipping providers, each with their own unique APIs and data formats.

```
┌─────────────────────────────────────────┐
│     Application Layer (Orders)         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│    ShippingAdapter Interface (types.ts) │
│  • rateQuote()                          │
│  • createLabel()                        │
│  • trackShipment()                      │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┼──────────┐
        ▼         ▼          ▼
    ┌──────┐  ┌──────┐  ┌──────┐
    │Shipr.│  │Delh. │  │Future│
    │Adapt.│  │Adapt.│  │Prov. │
    └──────┘  └──────┘  └──────┘
```

### Key Components

1. **types.ts**: Core type definitions and interface contract
2. **shiprocket.ts**: Shiprocket API adapter implementation
3. **delhivery.ts**: Delhivery API adapter implementation
4. **index.ts**: Factory pattern for provider selection and registration

## Provider Comparison

| Feature             | Shiprocket                | Delhivery             |
| ------------------- | ------------------------- | --------------------- |
| **Coverage**        | Pan-India + International | Pan-India             |
| **API Type**        | RESTful JSON              | RESTful JSON          |
| **Authentication**  | Email/Password → Token    | API Key (Bearer)      |
| **Token Caching**   | Yes (~9 days)             | N/A (key-based)       |
| **Rate Quotes**     | Serviceability API        | Invoice Charges API   |
| **Label Format**    | PDF via URL               | AWB code              |
| **Tracking**        | Real-time with activities | Real-time with scans  |
| **COD Support**     | Yes                       | Yes                   |
| **Webhook Support** | Yes (not implemented)     | Yes (not implemented) |
| **Sandbox**         | Available                 | Limited               |

## Implementation Details

### Shiprocket Adapter

#### Authentication Flow

```typescript
// First call: Login and cache token
POST / auth / login;
Body: {
  (email, password);
}
Response: {
  token: 'eyJ...';
}

// Token cached for ~9 days (exp - 1 day)
// Subsequent calls use: Authorization: Bearer {token}
```

#### Rate Quote Flow

```typescript
// 1. Get authentication token (cached)
const token = await this.getToken();

// 2. Query serviceability
GET /courier/serviceability?pickup_postcode=110001&delivery_postcode=560001&weight=1&cod=0
Authorization: Bearer {token}

// 3. Parse available couriers
Response: {
  data: {
    available_courier_companies: [
      { courier_name: "BlueDart", rate: 120, etd: "3" },
      { courier_name: "Delhivery", rate: 110, etd: "4" }
    ]
  }
}
```

#### Label Creation Flow

```typescript
// 1. Create adhoc order
POST /orders/create/adhoc
Body: {
  order_id: "ORD-12345",
  order_date: "2024-01-12",
  pickup_location: {...},
  billing_customer_name: "...",
  billing_address: {...},
  shipping_customer_name: "...",
  shipping_address: {...},
  order_items: [{...}],
  payment_method: "COD",
  sub_total: 1500
}
Response: { order_id: 12345, shipment_id: 67890 }

// 2. Assign AWB (Air Waybill) code
POST /courier/assign/awb
Body: { shipment_id: 67890 }
Response: {
  response: {
    data: {
      awb_code: "AWB123456789",
      label_url: "https://cdn.shiprocket.in/labels/..."
    }
  }
}
```

#### Tracking Flow

```typescript
GET /courier/track/awb/AWB123456789
Response: {
  tracking_data: {
    track_status: "7",
    shipment_status: 7,
    edd: "2024-01-15",
    shipment_track: [
      {
        current_status: "Delivered",
        date: "2024-01-15 10:30:00",
        location: "Bangalore",
        activity: "Package delivered"
      }
    ]
  }
}

// Status codes:
// 1: Pickup scheduled
// 4: In transit
// 6: Out for delivery
// 7: Delivered
```

### Delhivery Adapter

#### Rate Quote Flow

```typescript
GET /kinko/v1/invoice/charges?md=E&ss=Delivered&d_pin=560001&o_pin=110001&cgm=1000
Authorization: Token {api_key}

// md: E (Express/COD) or S (Surface/Prepaid)
// cgm: weight in grams
Response: [
  {
    total_amount: "120.50",
    expected_delivery_date: "4"
  }
]
```

#### Label Creation Flow

```typescript
// 1. Fetch waybill number
GET /waybill/api/bulk/json/?count=1
Authorization: Token {api_key}
Response: ["DHL123456789"]

// 2. Create shipment
POST /cmu/create.json
Authorization: Token {api_key}
Body: format=json&data={
  shipments: [{
    waybill: "DHL123456789",
    name: "Buyer Name",
    add: "Address",
    pin: "560001",
    city: "Bangalore",
    payment_mode: "COD",
    cod_amount: 1500,
    ...
  }],
  pickup_location: {...}
}
```

#### Tracking Flow

```typescript
GET /v1/packages/json/?waybill=DHL123456789
Authorization: Token {api_key}

Response: {
  ShipmentData: [{
    Shipment: {
      Status: { Status: "Delivered" },
      Scans: [
        {
          ScanDateTime: "2024-01-15T10:30:00Z",
          ScannedLocation: "Bangalore",
          ScanType: "Delivered",
          Instructions: "Package delivered"
        }
      ]
    }
  }]
}
```

## Usage Patterns

### Basic Integration

```typescript
import { getShippingAdapter } from '@/services/shipping';

// Automatic provider selection from env
const shipping = getShippingAdapter();

// Step 1: Get rate quotes
const quotes = await shipping.rateQuote({
  origin: { pincode: '110001', country: 'India' },
  destination: { pincode: '560001', country: 'India' },
  parcel: { weight: 2.5, length: 40, breadth: 30, height: 20 },
  paymentMode: 'cod',
});

// Step 2: Create shipping label
const label = await shipping.createLabel({
  orderId: order.id,
  origin: seller.address,
  destination: buyer.address,
  parcel: order.parcel,
  paymentMode: order.paymentMode,
  codAmount: order.total,
});

// Step 3: Track shipment
const tracking = await shipping.trackShipment({
  awbCode: label.awbCode,
});
```

### Order Integration

```typescript
// In order controller after payment confirmation
export async function confirmOrder(req, res) {
  const order = await Order.findById(req.params.orderId);

  // Create shipping label
  const shipping = getShippingAdapter();
  const label = await shipping.createLabel({
    orderId: order.id,
    origin: order.seller.address,
    destination: order.buyer.address,
    parcel: {
      weight: order.totalWeight,
      length: order.dimensions.length,
      breadth: order.dimensions.breadth,
      height: order.dimensions.height,
    },
    paymentMode: order.paymentMode,
    codAmount: order.paymentMode === 'cod' ? order.total : 0,
  });

  // Save tracking info
  order.shipment = {
    awbCode: label.awbCode,
    courier: label.courierName,
    labelUrl: label.labelUrl,
    status: 'pending',
  };
  await order.save();

  // Send tracking email to buyer
  await emailQueue.add('trackingCreated', {
    to: order.buyer.email,
    orderId: order.id,
    trackingUrl: `https://track.example.com/${label.awbCode}`,
  });
}
```

### Rate Shopping (Multi-Provider)

```typescript
async function getBestShippingRate(origin, destination, parcel) {
  const providers = ['shiprocket', 'delhivery'];
  const allQuotes = [];

  for (const provider of providers) {
    try {
      const adapter = getShippingAdapter(provider);
      const quotes = await adapter.rateQuote({ origin, destination, parcel });
      allQuotes.push(...quotes.map((q) => ({ ...q, provider })));
    } catch (error) {
      console.error(`Failed to get quotes from ${provider}:`, error);
    }
  }

  // Sort by rate and select cheapest
  allQuotes.sort((a, b) => a.rate - b.rate);
  return allQuotes[0]; // Cheapest option
}
```

### Tracking Updates (Webhook Handler - Future)

```typescript
// POST /webhooks/shipping/shiprocket
export async function handleShiprocketWebhook(req, res) {
  const { awb, status, location, timestamp } = req.body;

  // Verify webhook signature (not yet implemented)

  // Find order by AWB
  const order = await Order.findOne({ 'shipment.awbCode': awb });
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Update shipment status
  order.shipment.status = mapShiprocketStatus(status);
  order.shipment.currentLocation = location;
  order.shipment.lastUpdate = timestamp;

  // Add activity to history
  order.shipment.activities.push({
    timestamp,
    location,
    status,
  });

  await order.save();

  // Notify buyer if delivered
  if (order.shipment.status === 'delivered') {
    await emailQueue.add('orderDelivered', {
      to: order.buyer.email,
      orderId: order.id,
    });
  }

  res.json({ success: true });
}
```

## Error Handling

### Common Error Scenarios

1. **Authentication Failures**

```typescript
try {
  const token = await shiprocketAdapter.getToken();
} catch (error) {
  if (error.response?.status === 401) {
    // Invalid credentials
    throw new Error('Shiprocket authentication failed. Check credentials.');
  }
  throw error;
}
```

2. **Serviceability Issues**

```typescript
const quotes = await adapter.rateQuote(request);
if (quotes.length === 0) {
  throw new Error('No couriers available for this route');
}
```

3. **Label Creation Failures**

```typescript
try {
  const label = await adapter.createLabel(request);
} catch (error) {
  if (error.message.includes('waybill')) {
    // Waybill exhausted (Delhivery)
    // Fallback to alternate provider or retry
  }
  throw error;
}
```

4. **Tracking Not Found**

```typescript
const tracking = await adapter.trackShipment({ awbCode });
if (!tracking.activities || tracking.activities.length === 0) {
  // No tracking data yet (too early)
  return { status: 'pending', message: 'Tracking will be available soon' };
}
```

### Retry Strategy

```typescript
async function createLabelWithRetry(adapter, request, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await adapter.createLabel(request);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

## Testing

### Unit Tests Structure

All shipping adapters have comprehensive unit tests with mocked HTTP responses:

```typescript
// tests/shipping.adapters.spec.ts
describe('Shiprocket Adapter', () => {
  beforeEach(() => {
    mockedAxios.post.mockClear();
    mockedAxios.get.mockClear();
  });

  it('should cache auth token', async () => {
    // Mock login response
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'mock-token' }
    });

    // Mock two rate quote calls
    mockedAxios.get.mockResolvedValue({ data: {...} });

    await adapter.rateQuote(request);
    await adapter.rateQuote(request);

    // Login should be called only once
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });
});
```

### Running Tests

```bash
# All shipping tests
pnpm test -- --runTestsByPath tests/shipping.adapters.spec.ts

# Watch mode for development
pnpm test -- --watch tests/shipping.adapters.spec.ts

# With coverage
pnpm test -- --coverage tests/shipping.adapters.spec.ts
```

### Test Coverage

Current coverage:

- **14/14 tests passing** (100%)
- Token caching ✓
- Rate quotes ✓
- Label creation ✓
- Shipment tracking ✓
- Status mapping ✓
- Factory pattern ✓
- Error scenarios ✓

## Adding a New Provider

### Step-by-Step Guide

1. **Create Adapter File**

```typescript
// src/services/shipping/dtdc.ts
import axios from 'axios';
import { ShippingAdapter, ... } from './types';

export class DtdcAdapter implements ShippingAdapter {
  name = 'DTDC';
  private apiKey: string;
  private baseUrl: string;

  constructor(config?) {
    this.apiKey = config?.apiKey || process.env.DTDC_API_KEY || '';
    this.baseUrl = config?.baseUrl || process.env.DTDC_BASE_URL || 'https://api.dtdc.com';
  }

  async rateQuote(request: RateQuoteRequest): Promise<RateQuoteResponse[]> {
    // Implement DTDC rate API
    const resp = await axios.post(`${this.baseUrl}/rates`, {
      origin: request.origin.pincode,
      destination: request.destination.pincode,
      weight: request.parcel.weight,
    }, {
      headers: { 'X-API-Key': this.apiKey },
    });

    return resp.data.rates.map(r => ({
      courier: 'DTDC',
      serviceType: r.service,
      rate: r.amount,
      estimatedDays: r.tat,
      currency: 'INR',
    }));
  }

  async createLabel(request: CreateLabelRequest): Promise<CreateLabelResponse> {
    // Implement DTDC booking API
  }

  async trackShipment(request: TrackShipmentRequest): Promise<TrackShipmentResponse> {
    // Implement DTDC tracking API
  }
}
```

2. **Register in Factory**

```typescript
// src/services/shipping/index.ts
import { DtdcAdapter } from './dtdc';

const adapters: Record<ShippingProvider, ShippingAdapter> = {
  shiprocket: new ShiprocketAdapter(),
  delhivery: new DelhiveryAdapter(),
  dtdc: new DtdcAdapter(), // Add here
};

export type ShippingProvider = 'shiprocket' | 'delhivery' | 'dtdc'; // Update type
```

3. **Add Environment Variables**

```bash
# .env.example
DTDC_API_KEY=your-dtdc-api-key
DTDC_BASE_URL=https://api.dtdc.com
```

4. **Write Tests**

```typescript
// tests/shipping.adapters.spec.ts
describe('DTDC Adapter', () => {
  let adapter: DtdcAdapter;

  beforeEach(() => {
    adapter = new DtdcAdapter({ apiKey: 'test-key', baseUrl: 'https://test.api' });
  });

  it('should fetch rate quotes', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { rates: [{ service: 'Express', amount: 150, tat: 3 }] },
    });

    const quotes = await adapter.rateQuote(mockRequest);
    expect(quotes[0].rate).toBe(150);
  });
});
```

5. **Update Documentation**

Add provider to this doc and quick reference guide.

## Performance Considerations

### Token Caching (Shiprocket)

- Tokens are cached for ~9 days (expiry - 1 day buffer)
- Reduces authentication API calls significantly
- Memory overhead: ~500 bytes per token

### Rate Limiting

Currently no rate limiting implemented. Consider:

```typescript
// Future: Rate limiter per provider
import rateLimit from 'express-rate-limit';

const shiprocketLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: () => 'shiprocket', // Global limit
});
```

### Concurrent Requests

For rate shopping across providers:

```typescript
// Use Promise.allSettled for parallel requests
const results = await Promise.allSettled([
  getShippingAdapter('shiprocket').rateQuote(request),
  getShippingAdapter('delhivery').rateQuote(request),
]);

// Filter successful responses
const quotes = results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
```

## Security

### API Keys Management

- Store in environment variables (never in code)
- Use different keys for dev/staging/production
- Rotate keys periodically
- Never log API keys or tokens

### Token Storage (Shiprocket)

- Tokens stored in memory only (not persisted)
- Automatically expire after ~9 days
- Re-fetched on server restart

### Webhook Verification (Future)

```typescript
// Verify webhook signature
function verifyWebhookSignature(payload, signature, secret) {
  const computed = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
}
```

## Troubleshooting

### Common Issues

**Problem**: "Token expired" errors on Shiprocket

**Solution**: Token should auto-refresh. Check if expiry calculation is correct or manually clear cache.

---

**Problem**: No rate quotes returned

**Solution**:

- Verify pincodes are valid
- Check parcel weight is within limits
- Ensure COD is enabled for destination if using COD mode

---

**Problem**: Label creation fails with "Invalid AWB"

**Solution**:

- Check order format matches provider requirements
- Verify all required fields are present
- For Delhivery, ensure waybill is fresh (not expired)

---

**Problem**: Tracking shows "pending" indefinitely

**Solution**:

- Allow 2-4 hours after label creation for first scan
- Verify AWB code is correct
- Check provider's status page for outages

## Future Enhancements

### Planned Features

1. **Webhook Integration**: Real-time tracking updates from providers
2. **Bulk Label Creation**: Generate labels for multiple orders in one API call
3. **Return Label Generation**: Automated RMA label creation
4. **Pickup Scheduling**: Schedule pickups via API (currently manual)
5. **NDR Management**: Handle Non-Delivery Reports
6. **COD Remittance**: Track COD payments from couriers
7. **Insurance**: Add insurance to high-value shipments
8. **International Shipping**: Extend beyond India

### Integration Opportunities

- **ERP Sync**: Auto-sync AWB codes to vendor ERP systems
- **Analytics**: Track shipping costs, delivery performance per provider
- **Forecasting**: Predict delivery dates using ML based on historical data
- **Smart Routing**: Auto-select provider based on destination, cost, SLA

## API Reference Summary

### ShippingAdapter Interface

```typescript
interface ShippingAdapter {
  name: string;
  rateQuote(request: RateQuoteRequest): Promise<RateQuoteResponse[]>;
  createLabel(request: CreateLabelRequest): Promise<CreateLabelResponse>;
  trackShipment(request: TrackShipmentRequest): Promise<TrackShipmentResponse>;
}
```

### Type Definitions

See `apps/api/src/services/shipping/types.ts` for complete definitions:

- `Address`: Complete address with name, phone, pincode, etc.
- `Parcel`: Weight and dimensions
- `RateQuoteRequest/Response`: For getting shipping rates
- `CreateLabelRequest/Response`: For generating shipping labels
- `TrackShipmentRequest/Response`: For tracking shipments

## Related Documentation

- [Quick Reference Guide](./SHIPPING_QUICK_REFERENCE.md)
- [Dropshipping Integration](./DROPSHIP.md)
- Feature #179: Shipping Integrations (implementation spec)
- Feature #202: Reverse Logistics
- Feature #203: Courier Bidding System

---

**Last Updated**: January 2024  
**Maintainer**: NearbyBazaar Core Team  
**Version**: 1.0.0
