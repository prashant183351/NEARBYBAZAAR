/**
 * Dispute Model
 *
 * Handles buyer-vendor disputes for orders with SLA-based escalation.
 */
import { Schema, model, Document, Types } from 'mongoose';

export enum DisputeStatus {
  OPEN = 'open',
  VENDOR_RESPONDED = 'vendor_responded',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum DisputeCategory {
  ITEM_NOT_RECEIVED = 'item_not_received',
  NOT_AS_DESCRIBED = 'not_as_described',
  DAMAGED = 'damaged',
  REFUND_NOT_RECEIVED = 'refund_not_received',
  OTHER = 'other',
}

export type DisputeActor = 'buyer' | 'vendor' | 'admin' | 'system';

export interface IDisputeMessage {
  _id: Types.ObjectId;
  senderRole: DisputeActor;
  senderId?: Types.ObjectId | null;
  message: string;
  attachments?: string[];
  createdAt: Date;
}

export interface IDispute extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  vendorId: Types.ObjectId;
  buyerId: Types.ObjectId;
  category: DisputeCategory;
  subject: string;
  description?: string;
  status: DisputeStatus;
  messages: IDisputeMessage[];

  // SLA and timing
  slaRespondBy: Date; // when vendor must respond by
  respondedAt?: Date;
  escalatedAt?: Date;
  resolvedAt?: Date;

  // Resolution
  resolutionNote?: string;
  resolvedBy?: Types.ObjectId;

  // Meta
  createdAt: Date;
  updatedAt: Date;

  // Methods
  addMessage(
    senderRole: DisputeActor,
    senderId: Types.ObjectId | null,
    message: string,
    attachments?: string[],
  ): Promise<void>;
  escalate(reason?: string): Promise<void>;
  resolve(adminId: Types.ObjectId, resolutionNote: string): Promise<void>;
}

const messageSchema = new Schema<IDisputeMessage>(
  {
    senderRole: { type: String, enum: ['buyer', 'vendor', 'admin', 'system'], required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    attachments: [{ type: String, trim: true }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const disputeSchema = new Schema<IDispute>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: Object.values(DisputeCategory), required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 4000 },
    status: {
      type: String,
      enum: Object.values(DisputeStatus),
      default: DisputeStatus.OPEN,
      index: true,
    },
    messages: { type: [messageSchema], default: [] },

    slaRespondBy: { type: Date, required: true, index: true },
    respondedAt: { type: Date },
    escalatedAt: { type: Date },
    resolvedAt: { type: Date },

    resolutionNote: { type: String, trim: true, maxlength: 1000 },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// Indexes for dashboards
disputeSchema.index({ vendorId: 1, status: 1, createdAt: -1 });
disputeSchema.index({ buyerId: 1, createdAt: -1 });

disputeSchema.methods.addMessage = async function (
  senderRole: DisputeActor,
  senderId: Types.ObjectId | null,
  message: string,
  attachments?: string[],
): Promise<void> {
  this.messages.push({ senderRole, senderId, message, attachments, createdAt: new Date() } as any);

  // First vendor response
  if (senderRole === 'vendor' && this.status === DisputeStatus.OPEN) {
    this.status = DisputeStatus.VENDOR_RESPONDED;
    this.respondedAt = new Date();
  }

  await this.save();
};

disputeSchema.methods.escalate = async function (reason?: string): Promise<void> {
  if (this.status === DisputeStatus.RESOLVED) return;
  this.status = DisputeStatus.ESCALATED;
  this.escalatedAt = new Date();
  if (reason) {
    this.messages.push({
      senderRole: 'system',
      senderId: null,
      message: `Escalated: ${reason}`,
      createdAt: new Date(),
    } as any);
  }
  await this.save();
};

disputeSchema.methods.resolve = async function (
  adminId: Types.ObjectId,
  resolutionNote: string,
): Promise<void> {
  this.status = DisputeStatus.RESOLVED;
  this.resolvedAt = new Date();
  this.resolvedBy = adminId;
  this.resolutionNote = resolutionNote;
  await this.save();
};

// Set SLA on creation
const DEFAULT_SLA_DAYS = parseInt(process.env.SLA_VENDOR_RESPONSE_DAYS || '3', 10);
disputeSchema.pre('validate', function (next) {
  if (!this.slaRespondBy) {
    const d = new Date();
    d.setDate(d.getDate() + DEFAULT_SLA_DAYS);
    this.slaRespondBy = d;
  }
  next();
});

export const Dispute = model<IDispute>('Dispute', disputeSchema);
