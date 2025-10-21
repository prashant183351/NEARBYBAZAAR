# GST-Compliant Business Invoicing - Feature #241

## Overview
Implements GST-compliant invoice generation for B2B and B2C transactions in India, with automatic tax calculation, e-invoicing integration, and PDF generation.

## Key Features

### 1. GST-Compliant Invoice Generation
- ✅ Automatic invoice numbering (FY-based sequential)
- ✅ Intra-state vs Inter-state tax calculation
- ✅ CGST + SGST for intra-state transactions
- ✅ IGST for inter-state transactions
- ✅ HSN/SAC code support
- ✅ Buyer and seller GSTIN tracking

### 2. E-Invoicing Integration (GSTN)
- ✅ IRN (Invoice Reference Number) generation
- ✅ Acknowledgement number and date tracking
- ✅ QR code support for e-invoices
- ✅ Automatic detection of e-invoicing requirement
- ✅ Stub implementation with production-ready structure

### 3. PDF Generation
- ✅ Professional GST-compliant invoice layout
- ✅ Detailed line items with HSN codes
- ✅ Tax breakdown (CGST/SGST/IGST)
- ✅ Buyer and seller details with GSTIN
- ✅ Payment terms and notes
- ✅ E-invoice authentication indicator

## Database Schema

### Invoice Model
**File**: `apps/api/src/models/Invoice.ts`

```typescript
{
  // Invoice Identity
  invoiceNumber: string (unique, indexed) // e.g., "2024-25/00001"
  financialYear: string // e.g., "2024-25"
  invoiceDate: Date
  dueDate?: Date
  
  // Seller Details
  seller: {
    name: string
    gstin?: string
    pan?: string
    address: string
    state: string
    stateCode?: string
  }
  
  // Buyer Details
  buyer: {
    name: string
    gstin?: string // Required for B2B e-invoicing
    pan?: string
    address?: string
    state?: string
    stateCode?: string
  }
  
  // Line Items
  lineItems: [{
    description: string
    hsnCode?: string // HSN for goods, SAC for services
    quantity: number
    unitPrice: number
    taxableAmount: number
    gstBreakdown: {
      cgst: number // Central GST
      sgst: number // State GST
      igst: number // Integrated GST
      rate: number // GST rate percentage
    }
    totalAmount: number
  }]
  
  // Totals
  subtotal: number
  totalTax: number
  cgstTotal: number
  sgstTotal: number
  igstTotal: number
  grandTotal: number
  
  // References
  orderId: ObjectId (indexed)
  userId: ObjectId (indexed)
  
  // E-Invoicing
  irn?: string // Invoice Reference Number from GSTN
  ackNo?: string // Acknowledgement number
  ackDate?: Date
  qrCode?: string // QR code data
  
  // Status
  status: 'draft' | 'generated' | 'sent' | 'paid' | 'cancelled'
  
  // Additional
  paymentTerms?: string
  notes?: string
  
  timestamps: true
}
```

## API Endpoints

### 1. Generate Invoice
**POST** `/v1/invoices/generate`

Generate a GST-compliant invoice for an order.

**Request Body**:
```json
{
  "orderId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "sellerInfo": {
    "name": "NearbyBazaar Pvt Ltd",
    "gstin": "27AAAAA1234A1Z5",
    "pan": "AAAAA1234A",
    "address": "123 Main St, Mumbai",
    "state": "Maharashtra",
    "stateCode": "27"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "invoiceNumber": "2024-25/00001",
    "financialYear": "2024-25",
    "invoiceDate": "2025-01-20T...",
    "seller": { /* seller details */ },
    "buyer": { /* buyer details */ },
    "lineItems": [ /* items with GST breakdown */ ],
    "subtotal": 10000,
    "cgstTotal": 900,
    "sgstTotal": 900,
    "igstTotal": 0,
    "totalTax": 1800,
    "grandTotal": 11800,
    "irn": "MOCK-IRN-1234567890", // if e-invoicing applied
    "status": "generated"
  }
}
```

### 2. Get Invoice by Order
**GET** `/v1/invoices/order/:orderId`

Retrieve invoice for a specific order.

### 3. Get Invoice by Number
**GET** `/v1/invoices/:invoiceNumber`

Retrieve invoice by its number (URL-encode the slash, e.g., `2024-25%2F00001`).

### 4. List Invoices
**GET** `/v1/invoices?userId=xxx&status=generated&page=1&limit=20`

List invoices with pagination and filters.

**Query Parameters**:
- `userId`: Filter by user
- `status`: Filter by status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### 5. Download PDF
**GET** `/v1/invoices/:id/pdf`

Download invoice as PDF file.

**Response**: Binary PDF file with appropriate headers.

### 6. Regenerate IRN
**POST** `/v1/invoices/:id/regenerate-irn`

Regenerate e-invoice IRN (for failed or retry cases).

## Invoice Generation Logic

### Financial Year Calculation
Financial year in India runs from April to March:
- Jan-Mar: Previous year to current year (e.g., "2024-25")
- Apr-Dec: Current year to next year (e.g., "2025-26")

### Invoice Numbering
Format: `{FY}/{SEQUENCE}`
- Example: `2024-25/00001`, `2024-25/00002`, etc.
- Sequential within each financial year
- 5-digit zero-padded sequence number

### GST Calculation

#### Intra-State (Same State)
```
Taxable Amount: ₹10,000
GST Rate: 18%
Total GST: ₹1,800

Breakdown:
CGST (9%): ₹900
SGST (9%): ₹900
IGST: ₹0

Grand Total: ₹11,800
```

#### Inter-State (Different States)
```
Taxable Amount: ₹10,000
GST Rate: 18%
Total GST: ₹1,800

Breakdown:
CGST: ₹0
SGST: ₹0
IGST (18%): ₹1,800

Grand Total: ₹11,800
```

## E-Invoicing Integration

### When is E-Invoicing Required?
E-invoicing is mandatory for:
1. **B2B Transactions**: Both seller and buyer have GSTIN
2. **Turnover Threshold**: Seller's annual turnover exceeds ₹5 crore (subject to GST notifications)
3. **Categories**: Certain business categories as per GST rules

### E-Invoice Flow
```
1. Generate Invoice → Create invoice record in DB
2. Check E-Invoice Requirement → Both have GSTIN?
3. Prepare E-Invoice Request → Format per GSTN schema
4. Call GSTN API → Via GSP (GST Suvidha Provider)
5. Receive IRN & QR Code → Store in invoice record
6. Update Invoice Status → Mark as authenticated
```

### GSP Integration (Production)
To enable e-invoicing in production:

1. **Register with GSP**: Choose a GST Suvidha Provider (e.g., Adaequare, ClearTax, IRIS, etc.)

2. **Configure Environment Variables**:
```bash
GSTN_E_INVOICE_URL=https://gsp.adaequare.com/enriched/ei/api/invoice
GSTN_API_USERNAME=your_username
GSTN_API_PASSWORD=your_password
GSTN_SELLER_GSTIN=27AAAAA1234A1Z5
NODE_ENV=production
```

3. **API Workflow**:
   - Step 1: Authenticate → Get JWT token
   - Step 2: Submit invoice → Receive IRN
   - Step 3: Store IRN → Update invoice record

4. **Error Handling**:
   - Network failures → Retry with exponential backoff
   - Validation errors → Log and alert admin
   - Duplicate IRN → Handle gracefully

### Development/Testing
In non-production environments, the system returns mock IRN:
```json
{
  "success": true,
  "irn": "MOCK-IRN-1234567890",
  "ackNo": "MOCK-ACK-1234567890",
  "ackDate": "2025-01-20T10:30:00.000Z",
  "signedQrCode": "MOCK_QR_CODE_DATA"
}
```

## Integration with B2B Accounts

### Automatic B2B Detection
When generating an invoice, the system checks if the buyer is a business account:

```typescript
const user = await User.findById(order.user);
const buyer = {
  name: user.isBusiness 
    ? (user.businessProfile?.companyName || user.name) 
    : user.name,
  gstin: user.businessProfile?.gstin,
  pan: user.businessProfile?.pan,
  address: user.businessProfile?.address || ''
};
```

### GST Compliance for B2B
- Business buyer's GSTIN is included on invoice
- E-invoicing is automatically triggered if both have GSTIN
- Payment terms default to "Net 30" for business accounts

## PDF Generation

### Layout Features
- **Header**: Invoice number, date, IRN (if applicable)
- **Seller Section**: Name, GSTIN, PAN, address, state
- **Buyer Section**: Name, GSTIN, PAN, address, state
- **Line Items Table**: Description, HSN, Qty, Rate, Amount, Tax, Total
- **Tax Summary**: Subtotal, CGST, SGST, IGST, Grand Total
- **Footer**: Payment terms, notes, e-invoice authentication

### PDF Generation Service
**File**: `apps/api/src/services/invoice/pdf.ts`

```typescript
import { generateGSTInvoicePDF } from './services/invoice/pdf';

const invoice = await Invoice.findById(invoiceId);
const pdfBuffer = await generateGSTInvoicePDF(invoice);

// Stream to response
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
res.send(pdfBuffer);
```

## HSN/SAC Codes

### What are HSN/SAC Codes?
- **HSN**: Harmonized System of Nomenclature (for goods)
- **SAC**: Services Accounting Code (for services)
- Required on GST invoices for classification

### Implementation
Products/Services should have HSN/SAC codes assigned:
```typescript
// In Product model
{
  name: "Laptop",
  hsnCode: "8471", // HSN for computers
  // ...
}

// In Service model
{
  name: "Web Development",
  sacCode: "998314", // SAC for IT services
  // ...
}
```

## Error Handling

### Common Errors
1. **Order Not Found**: Return 404
2. **Duplicate Invoice**: Prevent creating invoice twice for same order
3. **E-Invoice Failure**: Log error, generate invoice without IRN
4. **PDF Generation Failure**: Return error with details

### Retry Logic
```typescript
// For e-invoice failures
if (eInvoiceResponse.success === false) {
  // Invoice is still created without IRN
  // Admin can manually retry via /regenerate-irn endpoint
  console.error('E-Invoice generation failed:', eInvoiceResponse.error);
}
```

## Security Considerations

1. **GSTIN Validation**: Validate format before storing
2. **Access Control**: Only authorized users can generate invoices
3. **Audit Trail**: Log all invoice operations
4. **Data Privacy**: Encrypt sensitive data (GSTIN, PAN) at rest
5. **E-Invoice Credentials**: Store API keys securely in environment

## Testing

### Unit Tests
```bash
# Test invoice generation logic
npm test apps/api/tests/invoice.spec.ts
```

### Manual Testing
```bash
# 1. Generate invoice for order
curl -X POST http://localhost:4000/v1/invoices/generate \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID",
    "sellerInfo": {
      "name": "Test Seller",
      "gstin": "27AAAAA1234A1Z5",
      "address": "123 Test St",
      "state": "Maharashtra"
    }
  }'

# 2. Get invoice by order
curl http://localhost:4000/v1/invoices/order/ORDER_ID

# 3. Download PDF
curl http://localhost:4000/v1/invoices/INVOICE_ID/pdf -o invoice.pdf
```

## Migration Guide

### Existing Orders
For orders created before this feature:
1. Backfill invoices using a migration script
2. Use historical order data to generate invoices
3. Mark as "generated" retroactively

### Data Migration Script
```typescript
// apps/api/src/migrations/backfill-invoices.ts
import { Order } from './models/Order';
import { generateInvoice } from './services/invoice/generator';

const orders = await Order.find({ /* criteria */ });
for (const order of orders) {
  try {
    await generateInvoice({ orderId: order._id, sellerInfo: {...} });
  } catch (error) {
    console.error(`Failed for order ${order._id}:`, error);
  }
}
```

## Future Enhancements

### Phase 1 (Current) ✅
- Basic invoice generation
- GST calculation
- E-invoicing stub
- PDF generation

### Phase 2 (Planned)
- [ ] Automatic GSTIN validation via GST portal API
- [ ] Credit note and debit note generation
- [ ] Multi-currency support (for exports)
- [ ] Custom invoice templates per vendor
- [ ] Batch invoice generation

### Phase 3 (Advanced)
- [ ] TDS (Tax Deducted at Source) calculation
- [ ] TCS (Tax Collected at Source) for certain categories
- [ ] Integration with accounting software (Tally, QuickBooks)
- [ ] Automated reconciliation with GSTR-1 filing
- [ ] E-way bill generation for goods transport

## Compliance Checklist

- ✅ Invoice numbering is sequential per FY
- ✅ GSTIN format validation
- ✅ Correct CGST/SGST/IGST calculation
- ✅ HSN/SAC codes present
- ✅ Buyer and seller details complete
- ✅ E-invoicing for applicable transactions
- ✅ PDF downloadable for records
- ✅ IRN stored for authenticated invoices
- ⚠️ TODO: GSTIN verification via GST portal
- ⚠️ TODO: State code mapping from address

## Related Documentation
- [B2B Buyer Accounts](./B2B_BUYER_ACCOUNTS.md)
- [Tax Engine](./TAX_ENGINE.md) (TODO)
- [Payment Integration](./PAYMENTS.md)
- [Order Management](./ORDERS.md)

## Support

### GST Compliance Queries
For questions about GST compliance, consult:
- GST Portal: https://www.gst.gov.in/
- GST Council Notifications
- Your company's CA or tax consultant

### Technical Support
For implementation issues:
- Check logs in `apps/api/logs/invoice.log`
- Review e-invoice API responses
- Verify environment configuration

## Changelog

### 2025-01-20 (Feature #241)
- ✅ Created Invoice model with GST fields
- ✅ Implemented invoice generator service
- ✅ Added e-invoicing stub with GSTN integration structure
- ✅ Built PDF generation using PDFKit
- ✅ Created invoice API routes
- ✅ Integrated with B2B buyer accounts
- ✅ Added comprehensive documentation

---

**Status**: ✅ Completed  
**Version**: 1.0  
**Last Updated**: 2025-01-20  
