// GSTN e-invoice integration stub
import axios from 'axios';

export interface GSTInvoice {
  invoiceNumber: string;
  date: string;
  sellerGSTIN: string;
  buyerGSTIN: string;
  total: number;
  items: Array<{ description: string; hsn: string; qty: number; rate: number; tax: number }>;
  irn?: string;
  ackNo?: string;
  ackDate?: string;
}

// Replace with real GSTN API endpoint and credentials
const GSTN_API_URL = process.env.GSTN_API_URL || 'https://api.gstn.gov.in/einvoice';
const GSTN_API_KEY = process.env.GSTN_API_KEY || '';

export async function uploadInvoiceToGSTN(invoice: GSTInvoice) {
  // Only upload if threshold triggers (e.g. B2B, >Rs 50L turnover, etc.)
  // This is a stub; real implementation will require digital signature, IRN, etc.
  try {
    const res = await axios.post(GSTN_API_URL, invoice, {
      headers: { 'x-api-key': GSTN_API_KEY },
    });
    return res.data;
  } catch (e: any) {
    throw new Error('GSTN upload failed: ' + (e.response?.data?.error || e.message));
  }
}
