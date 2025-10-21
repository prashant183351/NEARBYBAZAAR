import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// GST Tax Breakdown
const GSTBreakdownZ = z.object({
  cgst: z.number().min(0), // Central GST
  sgst: z.number().min(0), // State GST
  igst: z.number().min(0), // Integrated GST (for inter-state)
  rate: z.number().min(0).max(100), // GST rate percentage
});

const InvoiceLineItemZ = z.object({
  description: z.string(),
  hsnCode: z.string().optional(), // HSN/SAC code for goods/services
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  taxableAmount: z.number().min(0),
  gstBreakdown: GSTBreakdownZ,
  totalAmount: z.number().min(0),
});

export const InvoiceZ = z.object({
  invoiceNumber: z.string(), // Consecutive, unique invoice number
  financialYear: z.string(), // e.g., "2024-25"
  invoiceDate: z.date(),
  dueDate: z.date().optional(),
  
  // Seller details
  seller: z.object({
    name: z.string(),
    gstin: z.string().optional(),
    pan: z.string().optional(),
    address: z.string(),
    state: z.string(),
    stateCode: z.string().optional(),
  }),
  
  // Buyer details
  buyer: z.object({
    name: z.string(),
    gstin: z.string().optional(), // Required for B2B
    pan: z.string().optional(),
    address: z.string().optional(),
    state: z.string().optional(),
    stateCode: z.string().optional(),
  }),
  
  // Line items
  lineItems: z.array(InvoiceLineItemZ),
  
  // Totals
  subtotal: z.number().min(0),
  totalTax: z.number().min(0),
  cgstTotal: z.number().min(0),
  sgstTotal: z.number().min(0),
  igstTotal: z.number().min(0),
  grandTotal: z.number().min(0),
  
  // References
  orderId: z.string(),
  userId: z.string(),
  
  // E-invoicing
  irn: z.string().optional(), // Invoice Reference Number from GSTN
  ackNo: z.string().optional(), // Acknowledgement number
  ackDate: z.date().optional(),
  qrCode: z.string().optional(), // QR code for e-invoice
  
  // Status
  status: z.enum(['draft', 'generated', 'sent', 'paid', 'cancelled']).default('draft'),
  
  // Payment terms
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export type InvoiceType = Omit<z.infer<typeof InvoiceZ>, 'orderId' | 'userId'> & {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
} & Document;

const GSTBreakdownSchema = new Schema({
  cgst: { type: Number, required: true, default: 0 },
  sgst: { type: Number, required: true, default: 0 },
  igst: { type: Number, required: true, default: 0 },
  rate: { type: Number, required: true },
}, { _id: false });

const InvoiceLineItemSchema = new Schema({
  description: { type: String, required: true },
  hsnCode: { type: String },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxableAmount: { type: Number, required: true },
  gstBreakdown: { type: GSTBreakdownSchema, required: true },
  totalAmount: { type: Number, required: true },
}, { _id: false });

const InvoiceSchema = new Schema<InvoiceType>({
  invoiceNumber: { type: String, required: true, unique: true, index: true },
  financialYear: { type: String, required: true },
  invoiceDate: { type: Date, required: true, default: Date.now },
  dueDate: { type: Date },
  
  seller: {
    name: { type: String, required: true },
    gstin: { type: String },
    pan: { type: String },
    address: { type: String, required: true },
    state: { type: String, required: true },
    stateCode: { type: String },
  },
  
  buyer: {
    name: { type: String, required: true },
    gstin: { type: String },
    pan: { type: String },
    address: { type: String },
    state: { type: String },
    stateCode: { type: String },
  },
  
  lineItems: [InvoiceLineItemSchema],
  
  subtotal: { type: Number, required: true },
  totalTax: { type: Number, required: true },
  cgstTotal: { type: Number, required: true, default: 0 },
  sgstTotal: { type: Number, required: true, default: 0 },
  igstTotal: { type: Number, required: true, default: 0 },
  grandTotal: { type: Number, required: true },
  
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  irn: { type: String, index: true },
  ackNo: { type: String },
  ackDate: { type: Date },
  qrCode: { type: String },
  
  status: { 
    type: String, 
    enum: ['draft', 'generated', 'sent', 'paid', 'cancelled'], 
    default: 'draft',
    index: true 
  },
  
  paymentTerms: { type: String },
  notes: { type: String },
}, { timestamps: true });

export const Invoice = mongoose.model<InvoiceType>('Invoice', InvoiceSchema);
