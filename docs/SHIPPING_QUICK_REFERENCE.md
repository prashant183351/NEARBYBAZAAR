# Shipping Integrations - Quick Reference

## Overview

The shipping module provides a pluggable adapter pattern for integrating with multiple courier services. Currently supports Shiprocket and Delhivery with standardized interfaces for rate quotes, label creation, and shipment tracking.

## Features

- **Shiprocket Integration**: Full API support for India's leading shipping aggregator
- **Delhivery Integration**: Direct courier API integration
- **Pluggable Architecture**: Easy to add new shipping providers
- **Token Caching**: Efficient authentication with token reuse (Shiprocket)
- **Status Normalization**: Standardized shipment status across providers
- **Comprehensive Testing**: 14 unit tests with mocked HTTP responses

## API Reference

### Get Shipping Adapter

```typescript
import { getShippingAdapter } from '@/services/shipping';

// Use default provider from env (SHIPPING_PROVIDER)
const adapter = getShippingAdapter();

// Or specify provider explicitly
const shiprocket = getShippingAdapter('shiprocket');
const delhivery = getShippingAdapter('delhivery');
```

### Rate Quote

```typescript
const quotes = await adapter.rateQuote({
  origin: { pincode: '110001', country: 'India' },
  destination: { pincode: '560001', country: 'India' },
  parcel: { weight: 1.5, length: 30, breadth: 20, height: 10 },
  paymentMode: 'prepaid', // or 'cod'
});

// Response: RateQuoteResponse[]
// [{
//   courier: 'BlueDart',
//   serviceType: 'surface',
//   rate: 120.50,
//   estimatedDays: 3,
//   currency: 'INR'
// }]
```

### Create Shipping Label

```typescript
const label = await adapter.createLabel({
  orderId: 'ORD-12345',
  origin: {
    name: 'Seller Name',
    phone: '9876543210',
    addressLine1: '123 Main St',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    country: 'India',
  },
  destination: {
    name: 'Buyer Name',
    phone: '9123456789',
    addressLine1: '456 Oak Ave',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    country: 'India',
  },
  parcel: { weight: 1.5, length: 30, breadth: 20, height: 10 },
  paymentMode: 'cod',
  codAmount: 1500,
});

// Response: CreateLabelResponse
// {
//   awbCode: 'AWB123456789',
//   courierName: 'Shiprocket',
//   labelUrl: 'https://shipment-label.pdf',
//   pickupScheduled: true
// }
```

### Track Shipment

```typescript
const tracking = await adapter.trackShipment({
  awbCode: 'AWB123456789',
});

// Response: TrackShipmentResponse
// {
//   awbCode: 'AWB123456789',
//   status: 'in_transit', // pending | in_transit | out_for_delivery | delivered | failed | returned
//   currentLocation: 'Mumbai Hub',
//   estimatedDelivery: '2024-01-15',
//   activities: [
//     {
//       timestamp: '2024-01-12T10:30:00Z',
//       location: 'Mumbai Hub',
//       status: 'In Transit',
//       remarks: 'Package arrived at hub'
//     }
//   ]
// }
```

## Environment Configuration

### Required Variables

```bash
# Default provider (shiprocket or delhivery)
SHIPPING_PROVIDER=shiprocket

# Shiprocket (sandbox or production)
SHIPROCKET_EMAIL=your-email@example.com
SHIPROCKET_PASSWORD=your-password
SHIPROCKET_BASE_URL=https://apiv2.shiprocket.in/v1/external

# Delhivery
DELHIVERY_API_KEY=your-api-key
DELHIVERY_BASE_URL=https://track.delhivery.com/api
```

## Adapter Details

### Shiprocket

- **Authentication**: Email/password → Bearer token (cached for ~9 days)
- **Rate Quotes**: `/courier/serviceability` endpoint
- **Label Creation**: Two-step process (adhoc order + AWB assignment)
- **Tracking**: `/courier/track/awb/{awbCode}` endpoint
- **Status Codes**: Numeric (1-7) mapped to standard enum

### Delhivery

- **Authentication**: Token-based (API key in header)
- **Rate Quotes**: `/kinko/v1/invoice/charges` endpoint
- **Label Creation**: Waybill fetch + `/cmu/create.json` endpoint
- **Tracking**: `/v1/packages/json/` with waybill parameter
- **Status Codes**: Text-based mapped to standard enum

## Extending with New Providers

1. **Create Adapter Class**:

```typescript
// src/services/shipping/newprovider.ts
import { ShippingAdapter, RateQuoteRequest, ... } from './types';

export class NewProviderAdapter implements ShippingAdapter {
  name = 'NewProvider';

  async rateQuote(request: RateQuoteRequest): Promise<RateQuoteResponse[]> {
    // Implementation
  }

  async createLabel(request: CreateLabelRequest): Promise<CreateLabelResponse> {
    // Implementation
  }

  async trackShipment(request: TrackShipmentRequest): Promise<TrackShipmentResponse> {
    // Implementation
  }
}
```

2. **Register in Factory**:

```typescript
// src/services/shipping/index.ts
import { NewProviderAdapter } from './newprovider';

const adapters = {
  shiprocket: new ShiprocketAdapter(),
  delhivery: new DelhiveryAdapter(),
  newprovider: new NewProviderAdapter(),
};
```

3. **Add Environment Variables**:

```bash
NEWPROVIDER_API_KEY=...
```

4. **Write Tests**:

```typescript
// tests/shipping.adapters.spec.ts
describe('NewProvider Adapter', () => {
  it('should fetch rate quotes', async () => {
    // Test with mocked axios
  });
});
```

## Testing

Run shipping adapter tests:

```bash
cd apps/api
pnpm test -- --runTestsByPath tests/shipping.adapters.spec.ts
```

All 14 tests should pass:

- Shiprocket: Token caching, rate quotes, label creation, tracking, status mapping
- Delhivery: Rate quotes, label creation, tracking, missing data handling
- Factory: Default provider, explicit selection, env var usage, error handling

## Status Mapping

Standardized shipment statuses across all providers:

- `pending`: Order created, not yet picked up
- `in_transit`: Package in transit to destination
- `out_for_delivery`: Out for delivery (last mile)
- `delivered`: Successfully delivered
- `failed`: Delivery failed or cancelled
- `returned`: Returned to sender

Provider-specific codes are automatically mapped to these standard statuses.

## Common Patterns

### Error Handling

```typescript
try {
  const quotes = await adapter.rateQuote(request);
} catch (error) {
  // Handle API errors, network issues, etc.
  console.error('Failed to fetch quotes:', error);
}
```

### Conditional Provider Selection

```typescript
// Use different provider based on location or other criteria
const provider = destPincode.startsWith('11') ? 'delhivery' : 'shiprocket';
const adapter = getShippingAdapter(provider);
```

### Custom Adapter for Testing

```typescript
import { registerShippingAdapter } from '@/services/shipping';

const mockAdapter = {
  name: 'MockShipping',
  rateQuote: jest.fn().mockResolvedValue([...]),
  createLabel: jest.fn().mockResolvedValue({...}),
  trackShipment: jest.fn().mockResolvedValue({...}),
};

registerShippingAdapter('shiprocket', mockAdapter);
```

## Next Steps

1. **Integrate with Order Flow**: Call `createLabel()` when order is confirmed
2. **Webhook Handlers**: Listen for tracking updates from providers
3. **Rate Shopping**: Compare quotes from multiple providers and select best
4. **Fallback Logic**: If primary provider fails, try alternate
5. **Analytics**: Track shipping costs, delivery times, success rates per provider

## Related Documentation

- Feature #179: Shipping Integrations (chunk implementation)
- Dropshipping Module: `docs/DROPSHIP_QUICK_REFERENCE.md`
- Order & Checkout: Feature #175
