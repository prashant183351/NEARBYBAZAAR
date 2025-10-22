import { Router } from 'express';
import {
  generateInvoice,
  getInvoiceByOrder,
  getInvoiceByNumber,
} from '../services/invoice/generator';
import { generateEInvoice, isEInvoicingRequired } from '../services/invoice/einvoice';
import { generateGSTInvoicePDF } from '../services/invoice/pdf';
import { Invoice } from '../models/Invoice';

const router = Router();

/**
 * POST /v1/invoices/generate
 * Generate invoice for an order
 */
router.post('/generate', async (req, res) => {
  try {
    const { orderId, sellerInfo } = req.body;

    if (!orderId || !sellerInfo) {
      return res.status(400).json({
        success: false,
        error: 'orderId and sellerInfo are required',
      });
    }

    // Generate invoice
    const invoice = await generateInvoice({ orderId, sellerInfo });

    // Check if e-invoicing is required
    const needsEInvoice = isEInvoicingRequired(
      sellerInfo.gstin,
      invoice.buyer.gstin,
      invoice.grandTotal,
    );

    // Generate e-invoice if required
    if (needsEInvoice) {
      const eInvoiceRequest = {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate.toISOString(),
        sellerGstin: sellerInfo.gstin!,
        buyerGstin: invoice.buyer.gstin!,
        totalInvoiceValue: invoice.grandTotal,
        lineItems: invoice.lineItems.map((item) => ({
          description: item.description,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxableValue: item.taxableAmount,
          cgstRate: item.gstBreakdown.cgst > 0 ? item.gstBreakdown.rate / 2 : undefined,
          sgstRate: item.gstBreakdown.sgst > 0 ? item.gstBreakdown.rate / 2 : undefined,
          igstRate: item.gstBreakdown.igst > 0 ? item.gstBreakdown.rate : undefined,
          totalAmount: item.totalAmount,
        })),
      };

      const eInvoiceResponse = await generateEInvoice(eInvoiceRequest);

      if (eInvoiceResponse.success) {
        // Update invoice with IRN
        invoice.irn = eInvoiceResponse.irn;
        invoice.ackNo = eInvoiceResponse.ackNo;
        invoice.ackDate = eInvoiceResponse.ackDate ? new Date(eInvoiceResponse.ackDate) : undefined;
        invoice.qrCode = eInvoiceResponse.signedQrCode;
        await invoice.save();
      }
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/invoices/order/:orderId
 * Get invoice by order ID
 */
router.get('/order/:orderId', async (req, res) => {
  try {
    const invoice = await getInvoiceByOrder(req.params.orderId);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/invoices/:invoiceNumber
 * Get invoice by invoice number
 */
router.get('/:invoiceNumber', async (req, res) => {
  try {
    const invoice = await getInvoiceByNumber(req.params.invoiceNumber);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/invoices
 * List invoices (with pagination and filters)
 */
router.get('/', async (req, res) => {
  try {
    const { userId, status, page = 1, limit = 20 } = req.query;

    const filter: any = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [invoices, total] = await Promise.all([
      Invoice.find(filter).sort({ invoiceDate: -1 }).skip(skip).limit(Number(limit)).lean(),
      Invoice.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/invoices/:id/pdf
 * Download invoice as PDF
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const pdfBuffer = await generateGSTInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${invoice.invoiceNumber.replace('/', '-')}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/invoices/:id/regenerate-irn
 * Regenerate IRN for an existing invoice (if failed or needs retry)
 */
router.post('/:id/regenerate-irn', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    if (invoice.irn) {
      return res.status(400).json({
        success: false,
        error: 'Invoice already has an IRN. Cancel it first if regeneration is needed.',
      });
    }

    const needsEInvoice = isEInvoicingRequired(
      invoice.seller.gstin,
      invoice.buyer.gstin,
      invoice.grandTotal,
    );

    if (!needsEInvoice) {
      return res.status(400).json({
        success: false,
        error: 'E-invoicing not required for this invoice',
      });
    }

    const eInvoiceRequest = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate.toISOString(),
      sellerGstin: invoice.seller.gstin!,
      buyerGstin: invoice.buyer.gstin!,
      totalInvoiceValue: invoice.grandTotal,
      lineItems: invoice.lineItems.map((item) => ({
        description: item.description,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxableValue: item.taxableAmount,
        cgstRate: item.gstBreakdown.cgst > 0 ? item.gstBreakdown.rate / 2 : undefined,
        sgstRate: item.gstBreakdown.sgst > 0 ? item.gstBreakdown.rate / 2 : undefined,
        igstRate: item.gstBreakdown.igst > 0 ? item.gstBreakdown.rate : undefined,
        totalAmount: item.totalAmount,
      })),
    };

    const eInvoiceResponse = await generateEInvoice(eInvoiceRequest);

    if (eInvoiceResponse.success) {
      invoice.irn = eInvoiceResponse.irn;
      invoice.ackNo = eInvoiceResponse.ackNo;
      invoice.ackDate = eInvoiceResponse.ackDate ? new Date(eInvoiceResponse.ackDate) : undefined;
      invoice.qrCode = eInvoiceResponse.signedQrCode;
      await invoice.save();

      res.json({ success: true, data: invoice });
    } else {
      res.status(400).json({ success: false, error: eInvoiceResponse.error });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
