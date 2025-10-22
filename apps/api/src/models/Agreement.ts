import { Schema, model, Types } from 'mongoose';

export type AgreementType = 'sla' | 'compliance' | 'terms_of_service' | 'privacy_policy';
export type AcceptorType = 'vendor' | 'supplier';

export interface Agreement {
  _id?: Types.ObjectId;
  type: AgreementType;
  version: string; // e.g. "1.0", "2.1"
  title: string;
  content: string; // markdown or HTML
  effectiveDate: Date;
  createdAt: Date;
}

export interface AgreementAcceptance {
  _id?: Types.ObjectId;
  agreementId: Types.ObjectId;
  agreementVersion: string;
  acceptorId: Types.ObjectId; // vendorId or supplierId
  acceptorType: AcceptorType;
  acceptedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

const AgreementSchema = new Schema<Agreement>({
  type: {
    type: String,
    enum: ['sla', 'compliance', 'terms_of_service', 'privacy_policy'],
    required: true,
  },
  version: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  effectiveDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

AgreementSchema.index({ type: 1, version: 1 }, { unique: true });
AgreementSchema.index({ effectiveDate: -1 });

const AgreementAcceptanceSchema = new Schema<AgreementAcceptance>({
  agreementId: { type: Schema.Types.ObjectId, ref: 'Agreement', required: true },
  agreementVersion: { type: String, required: true },
  acceptorId: { type: Schema.Types.ObjectId, required: true },
  acceptorType: { type: String, enum: ['vendor', 'supplier'], required: true },
  acceptedAt: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String },
});

AgreementAcceptanceSchema.index({ agreementId: 1, acceptorId: 1, acceptorType: 1 });
AgreementAcceptanceSchema.index({ acceptorId: 1, acceptorType: 1, acceptedAt: -1 });

export const AgreementModel = model<Agreement>('Agreement', AgreementSchema);
export const AgreementAcceptanceModel = model<AgreementAcceptance>(
  'AgreementAcceptance',
  AgreementAcceptanceSchema,
);
