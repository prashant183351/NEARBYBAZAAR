import { buildInvoice, formatInvoice } from '../src/services/invoice/builder';
import { getFY } from '../src/services/invoice/number';
import { isEInvoicingRequired, generateEInvoice, cancelEInvoice } from '../src/services/invoice/einvoice';

describe('Invoice Service', () => {
  describe('buildInvoice', () => {
    it('calculates totals, commission, and tax correctly', () => {
  const order = {
        _id: 'order1',
        createdAt: new Date('2025-10-01'),
        user: 'vendor1',
        currency: 'INR',
        tax: 100,
  status: "confirmed",
        total: 1230,
        subtotal: 1200,
        isBulkOrder: false,
        deleted: false,
        paymentStatus: 'paid',
        businessAccount: false,
        creditUsed: 0,
        outstandingAmount: 0,
        paidAmount: 1230,
        items: [
          { product: { name: 'Product A' }, quantity: 2, price: 500, commission: 50, _id: 'item1' },
          { product: { name: 'Product B' }, quantity: 1, price: 200, commission: 20, _id: 'item2' },
        ],
  } as any; // as OrderType
      const invoice = buildInvoice(order, { taxEngine: o => ({ tax: o.tax, breakdown: { item1: 60, item2: 40 } }) });
      expect(invoice.subtotal).toBe(1200); // 2*500 + 1*200
      expect(invoice.commissionTotal).toBe(70); // 50+20
      expect(invoice.taxTotal).toBe(100);
      expect(invoice.total).toBe(1230); // subtotal - commission + tax
      expect(invoice.items[0].tax).toBe(60);
      expect(invoice.items[1].tax).toBe(40);
    });
    it('handles missing commission and tax breakdown', () => {
  const order = {
        _id: 'order2',
        createdAt: new Date('2025-10-02'),
        user: 'vendor2',
        currency: 'INR',
        tax: 0,
  status: "confirmed",
        total: 100,
        subtotal: 100,
        isBulkOrder: false,
        deleted: false,
        paymentStatus: 'paid',
        businessAccount: false,
        creditUsed: 0,
        outstandingAmount: 0,
        paidAmount: 100,
        items: [
          { product: { name: 'Product C' }, quantity: 1, price: 100 },
        ],
  } as any; // as OrderType
      const invoice = buildInvoice(order);
      expect(invoice.commissionTotal).toBe(0);
      expect(invoice.taxTotal).toBe(0);
      expect(invoice.total).toBe(100);
    });
  });

  describe('formatInvoice', () => {
    it('formats invoice as string', () => {
      const invoice = {
        invoiceNumber: 'INV-001',
        date: new Date('2025-10-01'),
        vendor: 'vendor1',
        items: [
          { description: 'Product A', quantity: 2, price: 500, commission: 50, net: 950, tax: 60, total: 1010 },
        ],
        subtotal: 1000,
        commissionTotal: 50,
        taxTotal: 60,
        total: 1010,
        currency: 'INR',
        breakdown: { item1: 60 },
      };
      const str = formatInvoice(invoice, 'en-IN', 'INR');
      expect(str).toContain('Invoice #INV-001');
      expect(str).toContain('Product A');
      expect(str).toContain('Subtotal:');
      expect(str).toContain('Total:');
    });
  });

  describe('getFY', () => {
    it('returns correct FY for April', () => {
      expect(getFY(new Date('2025-04-01'))).toBe('FY25-26');
    });
    it('returns correct FY for March', () => {
      expect(getFY(new Date('2025-03-31'))).toBe('FY24-25');
    });
  });

  describe('isEInvoicingRequired', () => {
    it('returns false if GSTINs missing', () => {
      expect(isEInvoicingRequired(undefined, 'GSTIN2')).toBe(false);
      expect(isEInvoicingRequired('GSTIN1', undefined)).toBe(false);
      expect(isEInvoicingRequired(undefined, undefined)).toBe(false);
    });
    it('returns true if both GSTINs present', () => {
      expect(isEInvoicingRequired('GSTIN1', 'GSTIN2')).toBe(true);
    });
  });

  describe('generateEInvoice', () => {
    it('returns mock IRN in dev', async () => {
      const req = {
        invoiceNumber: 'INV-001',
        invoiceDate: new Date().toISOString(),
        sellerGstin: 'GSTIN1',
        buyerGstin: 'GSTIN2',
        totalInvoiceValue: 1000,
        lineItems: [
          { description: 'Product', quantity: 1, unitPrice: 1000, taxableValue: 1000, totalAmount: 1000 },
        ],
      };
      const res = await generateEInvoice(req);
      expect(res.success).toBe(true);
      expect(res.irn).toContain('MOCK-IRN-');
    });
  });

  describe('cancelEInvoice', () => {
    it('returns true (stub)', async () => {
      const res = await cancelEInvoice('MOCK-IRN-123', 'Mistake');
      expect(res).toBe(true);
    });
  });
});
