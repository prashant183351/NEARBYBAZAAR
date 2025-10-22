import { InvoiceType } from '../../models/Invoice';

// Lazy PDF generator for invoices; avoids import overhead when unused
export async function generateInvoicePDF(params: {
  order: any;
  seller: { name: string; address?: string; gstin?: string };
  buyer: { name: string; address?: string; gstin?: string };
  tax: {
    cgst: number;
    sgst: number;
    igst: number;
    taxable: number;
    totalTax: number;
    grandTotal: number;
  };
  invoiceNumber: string;
}): Promise<Buffer> {
  // Lazy require to avoid dependency during tests that don't use this

  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 36 });
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text('TAX INVOICE', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text(`Invoice No: ${params.invoiceNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
    doc.moveDown();

    doc.text(`Seller: ${params.seller.name}`);
    if (params.seller.gstin) doc.text(`Seller GSTIN: ${params.seller.gstin}`);
    if (params.seller.address) doc.text(params.seller.address);
    doc.moveDown();

    doc.text(`Buyer: ${params.buyer.name}`);
    if (params.buyer.gstin) doc.text(`Buyer GSTIN: ${params.buyer.gstin}`);
    if (params.buyer.address) doc.text(params.buyer.address);
    doc.moveDown();

    doc.text(`Taxable Value: ₹${params.tax.taxable.toFixed(2)}`);
    if (params.tax.igst) doc.text(`IGST: ₹${params.tax.igst.toFixed(2)}`);
    if (params.tax.cgst) doc.text(`CGST: ₹${params.tax.cgst.toFixed(2)}`);
    if (params.tax.sgst) doc.text(`SGST: ₹${params.tax.sgst.toFixed(2)}`);
    doc.text(`Total Tax: ₹${params.tax.totalTax.toFixed(2)}`);
    doc.text(`Grand Total: ₹${params.tax.grandTotal.toFixed(2)}`);

    doc.end();
  });
}

/**
 * Generate GST-compliant PDF from Invoice model
 */
export async function generateGSTInvoicePDF(invoice: InvoiceType): Promise<Buffer> {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
    doc.moveDown(0.5);

    // Invoice Details
    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, {
      align: 'right',
    });
    if (invoice.irn) {
      doc.fontSize(8).text(`IRN: ${invoice.irn}`, { align: 'right' });
    }
    doc.moveDown(1);

    // Seller & Buyer Details
    const leftCol = 50;
    const rightCol = 320;
    const y = doc.y;

    doc.fontSize(12).font('Helvetica-Bold').text('Seller:', leftCol, y);
    doc.fontSize(9).font('Helvetica');
    doc.text(invoice.seller.name, leftCol, y + 15);
    if (invoice.seller.gstin) doc.text(`GSTIN: ${invoice.seller.gstin}`, leftCol, y + 27);
    if (invoice.seller.address) doc.text(invoice.seller.address, leftCol, y + 39, { width: 240 });

    doc.fontSize(12).font('Helvetica-Bold').text('Buyer:', rightCol, y);
    doc.fontSize(9).font('Helvetica');
    doc.text(invoice.buyer.name, rightCol, y + 15);
    if (invoice.buyer.gstin) doc.text(`GSTIN: ${invoice.buyer.gstin}`, rightCol, y + 27);
    if (invoice.buyer.address) doc.text(invoice.buyer.address, rightCol, y + 39, { width: 200 });

    doc.moveDown(5);

    // Line Items
    const tableY = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Description', leftCol, tableY);
    doc.text('Qty', leftCol + 250, tableY);
    doc.text('Rate', leftCol + 300, tableY);
    doc.text('Amount', leftCol + 360, tableY);
    doc.text('Tax', leftCol + 430, tableY);
    doc.text('Total', leftCol + 480, tableY);

    let itemY = tableY + 20;
    doc.font('Helvetica');
    invoice.lineItems.forEach((item) => {
      const tax = item.gstBreakdown.cgst + item.gstBreakdown.sgst + item.gstBreakdown.igst;
      doc.text(item.description, leftCol, itemY, { width: 240 });
      doc.text(item.quantity.toString(), leftCol + 250, itemY);
      doc.text(`₹${item.unitPrice.toFixed(2)}`, leftCol + 300, itemY);
      doc.text(`₹${item.taxableAmount.toFixed(2)}`, leftCol + 360, itemY);
      doc.text(`₹${tax.toFixed(2)}`, leftCol + 430, itemY);
      doc.text(`₹${item.totalAmount.toFixed(2)}`, leftCol + 480, itemY);
      itemY += 20;
    });

    // Totals
    itemY += 20;
    const totalsCol = leftCol + 360;
    doc.text('Subtotal:', totalsCol, itemY);
    doc.text(`₹${invoice.subtotal.toFixed(2)}`, totalsCol + 120, itemY, { align: 'right' });
    itemY += 15;

    if (invoice.cgstTotal > 0) {
      doc.text('CGST:', totalsCol, itemY);
      doc.text(`₹${invoice.cgstTotal.toFixed(2)}`, totalsCol + 120, itemY, { align: 'right' });
      itemY += 15;
    }
    if (invoice.sgstTotal > 0) {
      doc.text('SGST:', totalsCol, itemY);
      doc.text(`₹${invoice.sgstTotal.toFixed(2)}`, totalsCol + 120, itemY, { align: 'right' });
      itemY += 15;
    }
    if (invoice.igstTotal > 0) {
      doc.text('IGST:', totalsCol, itemY);
      doc.text(`₹${invoice.igstTotal.toFixed(2)}`, totalsCol + 120, itemY, { align: 'right' });
      itemY += 15;
    }

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Grand Total:', totalsCol, itemY);
    doc.text(`₹${invoice.grandTotal.toFixed(2)}`, totalsCol + 120, itemY, { align: 'right' });

    // Footer
    if (invoice.irn) {
      doc
        .fontSize(8)
        .font('Helvetica-Italic')
        .text('Authenticated by GSTN via e-Invoice', leftCol, doc.page.height - 60, {
          align: 'center',
          width: 500,
        });
    }

    doc.end();
  });
}
