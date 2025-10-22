/**
 * E-Invoicing Integration (Stub)
 *
 * This module provides a stub implementation for integrating with GSTN's
 * e-invoicing API to generate IRN (Invoice Reference Number) for B2B invoices.
 *
 * As per GST rules, e-invoicing is mandatory for businesses with turnover
 * above certain thresholds (currently ₹5 crore, subject to change).
 */

import axios from 'axios';

export interface EInvoiceRequest {
  invoiceNumber: string;
  invoiceDate: string; // ISO format
  sellerGstin: string;
  buyerGstin: string;
  totalInvoiceValue: number;
  lineItems: Array<{
    description: string;
    hsnCode?: string;
    quantity: number;
    unitPrice: number;
    taxableValue: number;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    totalAmount: number;
  }>;
}

export interface EInvoiceResponse {
  success: boolean;
  irn?: string; // Invoice Reference Number
  ackNo?: string; // Acknowledgement number
  ackDate?: string; // Acknowledgement date
  signedInvoice?: string; // Digitally signed invoice JSON
  signedQrCode?: string; // QR code data
  error?: string;
}

/**
 * Check if e-invoicing is required for this invoice
 *
 * E-invoicing is mandatory if:
 * 1. Both seller and buyer have GSTIN (B2B transaction)
 * 2. Seller's turnover exceeds threshold (currently ₹5 crore)
 * 3. Invoice value exceeds minimum threshold if applicable
 */
export function isEInvoicingRequired(
  sellerGstin?: string,
  buyerGstin?: string,
  _invoiceValue?: number,
): boolean {
  // Simplified check: require both GSTINs to be present
  if (!sellerGstin || !buyerGstin) return false;

  // TODO: Check seller's turnover from business profile
  // TODO: Check against current GST notification thresholds
  // TODO: Use _invoiceValue to check minimum threshold

  return true; // For now, assume required if both have GSTIN
}

/**
 * Generate e-invoice and obtain IRN from GSTN
 *
 * This is a STUB implementation. In production, you need to:
 * 1. Register with a GST Suvidha Provider (GSP) or Invoice Registration Portal (IRP)
 * 2. Obtain API credentials and endpoints
 * 3. Implement proper authentication (usually JWT-based)
 * 4. Handle signature generation and verification
 * 5. Implement proper error handling and retry logic
 */
export async function generateEInvoice(request: EInvoiceRequest): Promise<EInvoiceResponse> {
  // STUB: In production, replace with actual GSTN API endpoint
  const E_INVOICE_API_URL =
    process.env.GSTN_E_INVOICE_URL || 'https://gsp.adaequare.com/test/enriched/ei/api/invoice';
  const API_USERNAME = process.env.GSTN_API_USERNAME;
  const API_PASSWORD = process.env.GSTN_API_PASSWORD;
  const GSTIN = process.env.GSTN_SELLER_GSTIN;

  // For development/testing, return mock response
  if (!API_USERNAME || !API_PASSWORD || process.env.NODE_ENV !== 'production') {
    console.log('[E-Invoice] STUB: Would generate e-invoice for:', request.invoiceNumber);

    // Return mock IRN
    return {
      success: true,
      irn: `MOCK-IRN-${Date.now()}`,
      ackNo: `MOCK-ACK-${Date.now()}`,
      ackDate: new Date().toISOString(),
      signedQrCode: 'MOCK_QR_CODE_DATA',
    };
  }

  try {
    // PRODUCTION IMPLEMENTATION (STUB - CUSTOMIZE FOR YOUR GSP)
    // Step 1: Authenticate and get token
    const authResponse = await axios.post(`${E_INVOICE_API_URL}/authenticate`, {
      username: API_USERNAME,
      password: API_PASSWORD,
      gstin: GSTIN,
    });

    const authToken = authResponse.data.token;

    // Step 2: Generate IRN
    const irnResponse = await axios.post(
      `${E_INVOICE_API_URL}/generate`,
      {
        version: '1.1',
        tranDtls: {
          taxSch: 'GST',
          supTyp: 'B2B',
        },
        docDtls: {
          typ: 'INV',
          no: request.invoiceNumber,
          dt: request.invoiceDate.split('T')[0], // YYYY-MM-DD
        },
        sellerDtls: {
          gstin: request.sellerGstin,
        },
        buyerDtls: {
          gstin: request.buyerGstin,
        },
        itemList: request.lineItems.map((item, idx) => ({
          slNo: (idx + 1).toString(),
          prdDesc: item.description,
          hsnCd: item.hsnCode || '998314',
          qty: item.quantity,
          unit: 'NOS',
          unitPrice: item.unitPrice,
          totAmt: item.totalAmount,
          assAmt: item.taxableValue,
          cgstRt: item.cgstRate || 0,
          sgstRt: item.sgstRate || 0,
          igstRt: item.igstRate || 0,
        })),
        valDtls: {
          totInvVal: request.totalInvoiceValue,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      success: true,
      irn: irnResponse.data.irn,
      ackNo: irnResponse.data.ackNo,
      ackDate: irnResponse.data.ackDt,
      signedInvoice: irnResponse.data.signedInvoice,
      signedQrCode: irnResponse.data.signedQrCode,
    };
  } catch (error: any) {
    console.error('[E-Invoice] Error generating e-invoice:', error.message);
    return {
      success: false,
      error: error?.response?.data?.message || error.message,
    };
  }
}

/**
 * Cancel an e-invoice (if issued by mistake)
 *
 * STUB: Implement actual cancellation API call
 */
export async function cancelEInvoice(irn: string, reason: string): Promise<boolean> {
  console.log(`[E-Invoice] STUB: Would cancel IRN ${irn} with reason: ${reason}`);

  // TODO: Implement actual cancellation via GSTN API
  // Cancellation is only allowed within 24 hours of generation

  return true;
}
