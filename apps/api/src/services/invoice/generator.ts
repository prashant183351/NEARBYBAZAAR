import { Invoice } from '../../models/Invoice';
import { Order } from '../../models/Order';
import { User } from '../../models/User';
import { Product } from '../../models/Product';

interface InvoiceGenerationOptions {
  orderId: string;
  sellerInfo: {
    name: string;
    gstin?: string;
    pan?: string;
    address: string;
    state: string;
    stateCode?: string;
  };
}

/**
 * Get current financial year (April to March)
 * e.g., if current month is Jan 2025, FY is "2024-25"
 */
function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  
  if (month >= 4) {
    // April onwards: FY is current year to next year
    return `${year}-${(year + 1).toString().slice(2)}`;
  } else {
    // Jan-Mar: FY is previous year to current year
    return `${year - 1}-${year.toString().slice(2)}`;
  }
}

/**
 * Generate consecutive invoice number
 * Format: FY/SEQNO (e.g., "2024-25/00001")
 */
async function generateInvoiceNumber(): Promise<string> {
  const fy = getCurrentFinancialYear();
  const prefix = `${fy}/`;
  
  // Find the last invoice for this FY
  const lastInvoice = await Invoice.findOne({ financialYear: fy })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber')
    .lean();
  
  let seq = 1;
  if (lastInvoice && lastInvoice.invoiceNumber) {
    const parts = lastInvoice.invoiceNumber.split('/');
    if (parts.length === 2) {
      seq = parseInt(parts[1], 10) + 1;
    }
  }
  
  return `${prefix}${seq.toString().padStart(5, '0')}`;
}

/**
 * Calculate GST breakdown based on buyer and seller states
 * - Intra-state: CGST + SGST
 * - Inter-state: IGST
 */
function calculateGST(
  taxableAmount: number,
  gstRate: number,
  buyerState: string,
  sellerState: string
) {
  const totalGST = (taxableAmount * gstRate) / 100;
  const isInterState = buyerState.toLowerCase() !== sellerState.toLowerCase();
  
  if (isInterState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: totalGST,
      rate: gstRate,
    };
  } else {
    const halfGST = totalGST / 2;
    return {
      cgst: halfGST,
      sgst: halfGST,
      igst: 0,
      rate: gstRate,
    };
  }
}

/**
 * Generate GST-compliant invoice for an order
 */
export async function generateInvoice(options: InvoiceGenerationOptions) {
  const { orderId, sellerInfo } = options;
  
  // Fetch order with populated user and products
  const order = await Order.findById(orderId).populate('user').lean();
  if (!order) throw new Error('Order not found');
  
  const user = await User.findById(order.user).lean();
  if (!user) throw new Error('User not found');
  
  // Check if invoice already exists
  const existing = await Invoice.findOne({ orderId }).lean();
  if (existing) {
    throw new Error('Invoice already generated for this order');
  }
  
  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();
  const financialYear = getCurrentFinancialYear();
  
  // Buyer details
  const buyer = {
    name: user.isBusiness ? (user.businessProfile?.companyName || user.name) : user.name,
    gstin: user.businessProfile?.gstin,
    pan: user.businessProfile?.pan,
    address: user.businessProfile?.address || '',
    state: user.businessProfile?.address ? 'Unknown' : 'Unknown', // TODO: Extract from address
    stateCode: undefined,
  };
  
  // Process line items
  const lineItems = [];
  let subtotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  
  for (const item of order.items) {
    const product = await Product.findById(item.product).lean();
    if (!product) continue;
    
    const taxableAmount = item.price * item.quantity;
    const gstRate = 18; // Default GST rate (TODO: get from product category)
    
    const gstBreakdown = calculateGST(
      taxableAmount,
      gstRate,
      buyer.state || 'Unknown',
      sellerInfo.state
    );
    
    const totalAmount = taxableAmount + gstBreakdown.cgst + gstBreakdown.sgst + gstBreakdown.igst;
    
    lineItems.push({
      description: product.name || 'Product',
      hsnCode: (product as any).hsnCode || undefined,
      quantity: item.quantity,
      unitPrice: item.price,
      taxableAmount,
      gstBreakdown,
      totalAmount,
    });
    
    subtotal += taxableAmount;
    cgstTotal += gstBreakdown.cgst;
    sgstTotal += gstBreakdown.sgst;
    igstTotal += gstBreakdown.igst;
  }
  
  const totalTax = cgstTotal + sgstTotal + igstTotal;
  const grandTotal = subtotal + totalTax;
  
  // Create invoice
  const invoice = new Invoice({
    invoiceNumber,
    financialYear,
    invoiceDate: new Date(),
    seller: sellerInfo,
    buyer,
    lineItems,
    subtotal,
    totalTax,
    cgstTotal,
    sgstTotal,
    igstTotal,
    grandTotal,
    orderId,
    userId: order.user,
    status: 'generated',
    paymentTerms: user.isBusiness ? 'Net 30' : 'Immediate',
  });
  
  await invoice.save();
  
  return invoice;
}

/**
 * Get invoice by order ID
 */
export async function getInvoiceByOrder(orderId: string) {
  return await Invoice.findOne({ orderId }).lean();
}

/**
 * Get invoice by invoice number
 */
export async function getInvoiceByNumber(invoiceNumber: string) {
  return await Invoice.findOne({ invoiceNumber }).lean();
}
