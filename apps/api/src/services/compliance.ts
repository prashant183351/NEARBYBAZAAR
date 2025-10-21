// DPDP: Data storage location documentation
export function getDataStorageLocation() {
    // For compliance, document where user data is stored (e.g. AWS Mumbai region, MongoDB Atlas India)
    // This should be updated if infra changes
    return {
        provider: 'MongoDB Atlas',
        region: 'ap-south-1 (Mumbai, India)',
        backup: 'AWS S3 (ap-south-1)',
        notes: 'All user PII and transactional data is stored and processed within India as per DPDP compliance.'
    };
}
// --- GDPR/DPDP Compliance Suite ---
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { logger } from '../utils/logger';
import { Schema, model } from 'mongoose';

// Data export: returns user data (redacted)
async function exportUserData(userId: string): Promise<any> {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');
    const { password, ...safeUser } = user;
    await AuditLog.create({ user: userId, action: 'export', timestamp: new Date() });
    return { user: safeUser };
}

// Data deletion: redact user PII
async function deleteUserData(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
        email: undefined,
        phone: undefined,
        name: 'Deleted User',
        deleted: true,
    });
    await AuditLog.create({ user: userId, action: 'delete', timestamp: new Date() });
    logger.info(`[Compliance] User ${userId} data deleted/redacted`);
}

// Consent store (privacy/cookie)
const ConsentSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['privacy', 'cookie'], required: true },
    accepted: { type: Boolean, required: true },
    timestamp: { type: Date, default: Date.now },
    ip: { type: String },
});
const Consent = model('Consent', ConsentSchema);

async function recordConsent(userId: string, type: 'privacy'|'cookie', accepted: boolean, ip?: string) {
    await Consent.create({ user: userId, type, accepted, ip });
    await AuditLog.create({ user: userId, action: `consent_${type}_${accepted?'accept':'reject'}`, timestamp: new Date() });
}

export { exportUserData, deleteUserData, recordConsent, Consent };
import { Types } from 'mongoose';
import { AgreementModel, AgreementAcceptanceModel, AcceptorType, AgreementType } from '../models/Agreement';

/**
 * Check if an acceptor (vendor/supplier) has accepted the latest version of a specific agreement type.
 */
export async function hasAcceptedLatestAgreement(
    acceptorId: Types.ObjectId,
    acceptorType: AcceptorType,
    agreementType: AgreementType
): Promise<boolean> {
    // Find the latest agreement of this type
    const latestAgreement = await AgreementModel.findOne({ type: agreementType })
        .sort({ effectiveDate: -1 })
        .limit(1);

    if (!latestAgreement) {
        // No agreement defined yet, so consider it accepted
        return true;
    }

    // Check if this acceptor has accepted this version
    const acceptance = await AgreementAcceptanceModel.findOne({
        agreementId: latestAgreement._id,
        acceptorId,
        acceptorType,
    });

    return !!acceptance;
}

/**
 * Get all agreement types that require acceptance but haven't been accepted yet.
 */
export async function getPendingAgreements(
    acceptorId: Types.ObjectId,
    acceptorType: AcceptorType
): Promise<Array<{ type: AgreementType; version: string; title: string; content: string }>> {
    const allTypes: AgreementType[] = ['sla', 'compliance', 'terms_of_service', 'privacy_policy'];
    const pending = [];

    for (const type of allTypes) {
        const latestAgreement = await AgreementModel.findOne({ type })
            .sort({ effectiveDate: -1 })
            .limit(1);

        if (!latestAgreement) continue;

        const acceptance = await AgreementAcceptanceModel.findOne({
            agreementId: latestAgreement._id,
            acceptorId,
            acceptorType,
        });

        if (!acceptance) {
            pending.push({
                type: latestAgreement.type,
                version: latestAgreement.version,
                title: latestAgreement.title,
                content: latestAgreement.content,
            });
        }
    }

    return pending;
}

/**
 * Record acceptance of an agreement.
 */
export async function recordAcceptance(
    agreementId: Types.ObjectId,
    acceptorId: Types.ObjectId,
    acceptorType: AcceptorType,
    ipAddress?: string,
    userAgent?: string
): Promise<void> {
    const agreement = await AgreementModel.findById(agreementId);
    if (!agreement) {
        throw new Error('Agreement not found');
    }

    await AgreementAcceptanceModel.create({
        agreementId,
        agreementVersion: agreement.version,
        acceptorId,
        acceptorType,
        acceptedAt: new Date(),
        ipAddress,
        userAgent,
    });
}

/**
 * Enforce compliance: throw error if critical agreements not accepted.
 */
export async function enforceCompliance(
    acceptorId: Types.ObjectId,
    acceptorType: AcceptorType,
    criticalTypes: AgreementType[] = ['sla', 'compliance']
): Promise<void> {
    for (const type of criticalTypes) {
        const accepted = await hasAcceptedLatestAgreement(acceptorId, acceptorType, type);
        if (!accepted) {
            throw new Error(`You must accept the latest ${type} agreement to proceed.`);
        }
    }
}
