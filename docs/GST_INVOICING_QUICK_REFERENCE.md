# GST Invoicing - Quick Reference

## 🚀 Quick Start

### Generate Invoice for Order

```bash
POST /v1/invoices/generate
Content-Type: application/json

{
  "orderId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "sellerInfo": {
    "name": "Your Company Name",
    "gstin": "27AAAAA1234A1Z5",
    "pan": "AAAAA1234A",
    "address": "Your Address",
    "state": "Maharashtra",
    "stateCode": "27"
  }
}
```

### Download Invoice PDF

```bash
GET /v1/invoices/{invoiceId}/pdf
```

### Get Invoice by Order

```bash
GET /v1/invoices/order/{orderId}
```

## 📋 Invoice Number Format

- **Pattern**: `{FY}/{SEQUENCE}`
- **Example**: `2024-25/00001`
- **Financial Year**: April to March
- **Sequence**: 5-digit zero-padded

## 💰 GST Calculation

### Intra-State (Same State)

```
Product Price: ₹10,000
GST Rate: 18%

CGST (9%): ₹900
SGST (9%): ₹900
Total Tax: ₹1,800
Grand Total: ₹11,800
```

### Inter-State (Different States)

```
Product Price: ₹10,000
GST Rate: 18%

IGST (18%): ₹1,800
Total Tax: ₹1,800
Grand Total: ₹11,800
```

## 🔐 E-Invoice Requirements

### When E-Invoicing is Required

- ✅ Both seller and buyer have GSTIN
- ✅ Seller turnover > ₹5 crore (or as per GST rules)
- ✅ B2B transaction

### E-Invoice Process

1. Generate invoice → System creates record
2. Check eligibility → Both have GSTIN?
3. Call GSTN API → Get IRN
4. Store IRN → Update invoice
5. Generate QR code → For verification

## 🏗️ Invoice Schema (Key Fields)

```typescript
{
  invoiceNumber: "2024-25/00001",      // Unique, sequential
  financialYear: "2024-25",            // FY period

  seller: {
    name: string,
    gstin: string,                     // 15-char GSTIN
    pan: string,                       // 10-char PAN
    address: string,
    state: string,
    stateCode: string                  // 2-digit code
  },

  buyer: {
    name: string,
    gstin?: string,                    // Required for B2B e-invoice
    pan?: string,
    address?: string,
    state?: string,
    stateCode?: string
  },

  lineItems: [{
    description: string,
    hsnCode: string,                   // HSN for goods, SAC for services
    quantity: number,
    unitPrice: number,
    taxableAmount: number,
    gstBreakdown: {
      cgst: number,
      sgst: number,
      igst: number,
      rate: number                     // e.g., 18
    },
    totalAmount: number
  }],

  // Totals
  subtotal: number,
  cgstTotal: number,
  sgstTotal: number,
  igstTotal: number,
  totalTax: number,
  grandTotal: number,

  // E-Invoice
  irn?: string,                        // From GSTN
  ackNo?: string,
  ackDate?: Date,
  qrCode?: string,

  // Status
  status: 'draft' | 'generated' | 'sent' | 'paid' | 'cancelled',

  // References
  orderId: ObjectId,
  userId: ObjectId
}
```

## 🔧 Environment Variables

```bash
# E-Invoicing (Production)
GSTN_E_INVOICE_URL=https://gsp.provider.com/api/invoice
GSTN_API_USERNAME=your_username
GSTN_API_PASSWORD=your_password
GSTN_SELLER_GSTIN=27AAAAA1234A1Z5
NODE_ENV=production

# Development
NODE_ENV=development  # Uses mock IRN
```

## 📁 File Locations

### Backend

- Model: `apps/api/src/models/Invoice.ts`
- Generator: `apps/api/src/services/invoice/generator.ts`
- E-Invoice: `apps/api/src/services/invoice/einvoice.ts`
- PDF: `apps/api/src/services/invoice/pdf.ts`
- Routes: `apps/api/src/routes/invoices.ts`

### Documentation

- Full Guide: `docs/GST_INVOICING.md`
- Quick Reference: `docs/GST_INVOICING_QUICK_REFERENCE.md` (this file)

## 🧪 Testing

### 1. Test Invoice Generation

```bash
curl -X POST http://localhost:4000/v1/invoices/generate \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID_HERE",
    "sellerInfo": {
      "name": "Test Company",
      "gstin": "27AAAAA1234A1Z5",
      "address": "123 Test St",
      "state": "Maharashtra"
    }
  }'
```

### 2. Verify Invoice

```bash
# By order ID
curl http://localhost:4000/v1/invoices/order/ORDER_ID

# By invoice number (URL-encode the slash)
curl http://localhost:4000/v1/invoices/2024-25%2F00001
```

### 3. Download PDF

```bash
curl http://localhost:4000/v1/invoices/INVOICE_ID/pdf -o test-invoice.pdf
```

## ⚠️ Common Issues

### Issue: Duplicate Invoice Error

**Solution**: Each order can only have one invoice. Check if invoice already exists.

### Issue: E-Invoice Generation Fails

**Solution**: Invoice is still created without IRN. Use `/regenerate-irn` endpoint to retry.

### Issue: Wrong GST Calculation

**Solution**: Verify buyer and seller states. Same state = CGST+SGST, different = IGST.

### Issue: Missing HSN Code

**Solution**: Ensure products have HSN/SAC codes assigned in the product model.

### Issue: Invoice Number Not Sequential

**Solution**: System uses atomic counters. Check if multiple servers are running without shared DB.

## 📊 Status Workflow

```
draft → generated → sent → paid → cancelled
   ↓         ↓        ↓       ↓
   └─────────┴────────┴───────┘
              (can cancel)
```

## 🔍 Quick Debugging

### Check Invoice Exists

```javascript
const invoice = await Invoice.findOne({ orderId: 'ORDER_ID' });
console.log(invoice ? 'Found' : 'Not found');
```

### Check E-Invoice Status

```javascript
const invoice = await Invoice.findById('INVOICE_ID');
console.log('IRN:', invoice.irn || 'Not generated');
console.log('Status:', invoice.status);
```

### Force E-Invoice Regeneration

```bash
POST /v1/invoices/{invoiceId}/regenerate-irn
```

## 📞 Getting Help

### For GST Compliance

- GST Portal: https://www.gst.gov.in/
- Consult your CA or tax advisor

### For Technical Issues

1. Check logs: `apps/api/logs/`
2. Review error messages from GSTN API
3. Verify environment configuration
4. Test with mock data first

## 🎯 Next Steps

### Immediate

- [ ] Test invoice generation with sample order
- [ ] Verify PDF rendering
- [ ] Check GST calculations

### Short-term

- [ ] Register with GSP for e-invoicing
- [ ] Set up production credentials
- [ ] Build admin UI for invoice management
- [ ] Create buyer invoice view

### Long-term

- [ ] Auto-generate on order confirmation
- [ ] Email invoices to buyers
- [ ] Add credit/debit note support
- [ ] Integrate with accounting software

---

**Quick Links**:

- [Full Documentation](./GST_INVOICING.md)
- [B2B Accounts](./B2B_BUYER_ACCOUNTS.md)
- [API Reference](./API_REFERENCE.md)

**Last Updated**: 2025-01-20
