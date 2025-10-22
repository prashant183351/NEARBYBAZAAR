import { OrderType } from '../../models/Order';
import { formatCurrency } from '@nearbybazaar/lib';

export interface InvoiceOptions {
  locale?: string;
  currency?: string;
  taxEngine?: (order: OrderType) => { tax: number; breakdown: any };
}

export interface Invoice {
  invoiceNumber: string;
  date: Date;
  vendor: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    commission: number;
    net: number;
    tax: number;
    total: number;
  }>;
  subtotal: number;
  commissionTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  breakdown: any;
}

export function buildInvoice(order: OrderType, opts: InvoiceOptions = {}): Invoice {
  const currency = opts.currency || order.currency || 'INR';
  const taxResult = opts.taxEngine ? opts.taxEngine(order) : { tax: order.tax, breakdown: {} };
  let commissionTotal = 0;
  const taxTotal = taxResult.tax || 0;
  let subtotal = 0;
  const items = (order.items as any[]).map((item: any) => {
    const commission = item.commission || 0;
    commissionTotal += commission;
    const net = item.price * item.quantity - commission;
    const tax = taxResult.breakdown[item._id?.toString()] || 0;
    subtotal += item.price * item.quantity;
    return {
      description: item.product?.name || item.product?.toString() || '',
      quantity: item.quantity,
      price: item.price,
      commission,
      net,
      tax,
      total: net + tax,
    };
  });
  return {
    invoiceNumber: order._id ? order._id.toString() : '',
    date: order.createdAt || new Date(),
    vendor: order.user?.toString(),
    items,
    subtotal,
    commissionTotal,
    taxTotal,
    total: subtotal - commissionTotal + taxTotal,
    currency,
    breakdown: taxResult.breakdown,
  };
}

export function formatInvoice(invoice: Invoice, locale = 'en-IN', currency = 'INR'): string {
  const fmt = (n: number) => formatCurrency(n, locale, currency);
  let out = `Invoice #${invoice.invoiceNumber}\nDate: ${invoice.date.toLocaleDateString(locale)}\nVendor: ${invoice.vendor}\n\nItems:\n`;
  out += 'Description | Qty | Price | Commission | Net | Tax | Total\n';
  for (const item of invoice.items) {
    out += `${item.description} | ${item.quantity} | ${fmt(item.price)} | ${fmt(item.commission)} | ${fmt(item.net)} | ${fmt(item.tax)} | ${fmt(item.total)}\n`;
  }
  out += `\nSubtotal: ${fmt(invoice.subtotal)}\nCommission: ${fmt(invoice.commissionTotal)}\nTax: ${fmt(invoice.taxTotal)}\nTotal: ${fmt(invoice.total)}\n`;
  return out;
}
