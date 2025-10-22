# B2B Buyer Accounts - Feature #240

## Overview

Extends the NearbyBazaar platform to support Business (B2B) accounts with specialized features for bulk buying, wholesale pricing, and RFQ workflows.

## Backend Implementation

### User Model Extensions

**File**: `apps/api/src/models/User.ts`

Added fields to support business accounts:

```typescript
isBusiness: boolean (default: false)
businessProfile: {
  companyName: string
  gstin?: string  // GST Identification Number
  pan?: string    // Permanent Account Number
  address?: string
}
```

### API Endpoints

**File**: `apps/api/src/routes/b2b.ts`

#### POST /v1/b2b/register

Upgrade user to business account or update business profile.

**Request Body**:

```json
{
  "companyName": "Example Corp",
  "gstin": "GSTIN123",
  "pan": "PAN123",
  "address": "Business address"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    /* User object with business fields */
  }
}
```

#### GET /v1/b2b/me

Retrieve business profile for current user.

**Response**:

```json
{
  "success": true,
  "data": {
    "isBusiness": true,
    "businessProfile": {
      /* profile data */
    },
    "name": "...",
    "email": "..."
  }
}
```

## Frontend Implementation

### B2B Registration Page

**File**: `apps/web/pages/b2b/register.tsx`

Form to collect and submit business information:

- Company Name (required)
- GSTIN (optional)
- PAN (optional)
- Business Address (optional)

### B2B Dashboard

**File**: `apps/web/pages/b2b/index.tsx`

Displays:

- Business account status
- Business profile details
- Available B2B features:
  - Access to wholesale-only products
  - RFQ creation for bulk orders
  - Bulk pricing visibility

### API Proxy

**File**: `apps/web/pages/api/b2b/[...path].ts`

Next.js API route to proxy B2B requests to backend with proper error handling.

## Features Enabled for B2B Accounts

### 1. Wholesale-Only Products

- Business accounts can view and purchase products marked as `wholesaleOnly: true`
- Regular consumers see prompts to upgrade to business account

### 2. Bulk Pricing

- Access to tiered wholesale pricing based on quantity
- Enforced minimum order quantities (MOQ)
- Automatic price calculation based on quantity

### 3. RFQ System

- Create Request for Quote (RFQ) for bulk purchases
- Receive and compare quotes from multiple vendors
- Negotiate prices through messaging system
- Accept quotes and convert to orders

### 4. GST-Compliant Invoicing

- Business invoices include GSTIN and PAN details
- Proper tax breakdown for B2B transactions
- Support for inter-state and intra-state GST calculations

## Integration Points

### Product Model

**File**: `apps/api/src/models/Product.ts`

- `wholesaleOnly`: Flag for B2B-only products
- `minOrderQty`: Minimum order quantity
- `wholesalePricing`: Array of quantity-based price tiers

### RFQ System

**Files**:

- `apps/api/src/models/RFQ.ts`
- `apps/api/src/models/RFQQuote.ts`
- `apps/api/src/routes/rfq.ts`

Allows B2B buyers to:

- Submit RFQs with product requirements
- Receive vendor quotes
- Negotiate and finalize bulk orders

## Authentication & Authorization

Currently uses fallback authentication (userId in request body or query for demo).

**Production TODO**:

- Integrate with JWT authentication middleware
- Extract `userId` from `req.user` (populated by auth middleware)
- Apply RBAC to restrict B2B endpoints to authenticated users
- Gate wholesale-only product visibility based on `isBusiness` flag

## Usage Flow

### For Buyers

1. **Registration**: Visit `/b2b/register` to upgrade to business account
2. **Dashboard**: Access `/b2b/` to view profile and features
3. **Shopping**: Browse products with bulk pricing and wholesale-only items
4. **RFQ**: Create RFQs for bulk purchases via vendor or product pages
5. **Quotes**: Review and accept vendor quotes

### For Vendors

1. **RFQ Listing**: View relevant RFQs at `/rfq` (vendor portal)
2. **Quote Submission**: Submit competitive quotes with pricing and lead times
3. **Negotiation**: Message buyers through RFQ quote threads
4. **Fulfillment**: Process accepted quotes as standard orders

## Database Schema

### User Collection

```javascript
{
  email: String (unique, indexed),
  password: String,
  name: String,
  role: Enum['user', 'vendor', 'admin'],
  isBusiness: Boolean,
  businessProfile: {
    companyName: String,
    gstin: String (optional),
    pan: String (optional),
    address: String (optional)
  },
  timestamps: true
}
```

## Dependencies

- **axios**: HTTP client for API calls
- **web-vitals**: Performance monitoring
- All existing NearbyBazaar dependencies

## Testing

### Manual Testing

1. Register a new business account via `/b2b/register`
2. Verify business profile appears in `/b2b/` dashboard
3. Check that wholesale products become visible
4. Test RFQ creation and quote acceptance flows

### Unit Tests (TODO)

- Test business profile validation (Zod schema)
- Test API endpoints for proper responses
- Test RBAC enforcement on B2B-only features

## Security Considerations

1. **PII Protection**: Business data (GSTIN, PAN) should be encrypted at rest
2. **Verification**: Consider KYC verification before enabling full B2B features
3. **Rate Limiting**: Apply rate limits to registration and RFQ endpoints
4. **Audit Logging**: Track all B2B account changes and transactions

## Future Enhancements

### Phase 1 (Current)

- ✅ Basic B2B account registration
- ✅ Business profile management
- ✅ Integration with wholesale products and RFQ

### Phase 2

- [ ] Automated GST/PAN verification via external APIs
- [ ] Credit limit management for B2B accounts
- [ ] Net payment terms (Net 30, Net 60, etc.)
- [ ] Bulk order templates and repeat orders

### Phase 3

- [ ] Advanced analytics for B2B buyers
- [ ] Contract management and pricing agreements
- [ ] Multi-user business accounts (team members)
- [ ] Approval workflows for large purchases

## Related Documentation

- [FORMS.md](./FORMS.md) - Form builder used in registration
- [RFQ System](./RFQ.md) - Request for Quote workflows (TODO)
- [PRICING.md](./PRICING.md) - Commission and pricing logic
- [PLANS.md](./PLANS.md) - Vendor subscription plans

## API Quick Reference

```bash
# Register/Upgrade to Business Account
POST /v1/b2b/register
Content-Type: application/json
{
  "companyName": "ACME Corp",
  "gstin": "27AAAAA1234A1Z5",
  "pan": "AAAAA1234A"
}

# Get Business Profile
GET /v1/b2b/me?userId=<id>

# Frontend Access
https://your-domain/b2b/register
https://your-domain/b2b/
```

## Changelog

### 2025-01-20 (Feature #240)

- ✅ Added `isBusiness` and `businessProfile` fields to User model
- ✅ Created B2B registration and profile API endpoints
- ✅ Built registration form and dashboard UI in web app
- ✅ Integrated with existing RFQ and wholesale product features
- ✅ Added API proxy for Next.js frontend

---

**Status**: ✅ Completed  
**Version**: 1.0  
**Last Updated**: 2025-01-20
