import { Types } from 'mongoose';
import { ProductType } from '../models/Product';
import { OrderLineItemWarranty } from '../models/Order';
import { emailQueue } from '../queues';
import { logger } from '../utils/logger';

export type WarrantyDurationUnit = 'days' | 'months' | 'years';

export interface WarrantyReminderJob {
    orderId: Types.ObjectId;
    lineItemId: Types.ObjectId;
    userId: Types.ObjectId;
    warranty: OrderLineItemWarranty;
    bufferDays?: number;
}

const MS_IN_DAY = 24 * 60 * 60 * 1000;

export function calculateWarrantyExpiry(startDate: Date, durationValue?: number, durationUnit: WarrantyDurationUnit = 'months'): Date | null {
    if (!durationValue || durationValue <= 0) return null;
    const expiry = new Date(startDate);
    switch (durationUnit) {
        case 'days':
            expiry.setDate(expiry.getDate() + durationValue);
            break;
        case 'months':
            expiry.setMonth(expiry.getMonth() + durationValue);
            break;
        case 'years':
            expiry.setFullYear(expiry.getFullYear() + durationValue);
            break;
        default:
            return null;
    }
    return expiry;
}

export function buildWarrantySnapshot(product: Pick<ProductType, 'warranty'>, startDate: Date): OrderLineItemWarranty | null {
    const src = (product as any).warranty as ProductType['warranty'];
    if (!src || src.available === false || !src.durationValue) {
        return null;
    }

    const expiry = calculateWarrantyExpiry(startDate, src.durationValue, src.durationUnit || 'months');

    return {
        available: src.available ?? true,
        providedBy: src.providedBy,
        providerName: src.providerName,
        durationValue: src.durationValue,
        durationUnit: src.durationUnit,
        coverage: src.coverage,
        terms: src.terms,
        termsUrl: src.termsUrl,
        supportContact: src.supportContact,
        serviceType: src.serviceType,
        documents: src.documents?.map((doc) => ({
            title: doc.title,
            url: doc.url,
            description: doc.description,
        })),
        startDate,
        expiryDate: expiry || undefined,
        status: 'active',
    };
}

export function resolveWarrantyStatus(warranty: OrderLineItemWarranty | undefined, snapshotDate: Date = new Date()): 'active' | 'expired' | 'claimed' | 'void' {
    if (!warranty) return 'void';
    if (warranty.status && warranty.status !== 'active') {
        return warranty.status;
    }
    if (warranty.expiryDate && new Date(warranty.expiryDate).getTime() < snapshotDate.getTime()) {
        return 'expired';
    }
    return 'active';
}

export async function scheduleWarrantyExpiryReminder({ orderId, lineItemId, userId, warranty, bufferDays }: WarrantyReminderJob): Promise<void> {
    try {
        if (!warranty?.expiryDate) return;

        const reminderBuffer = typeof bufferDays === 'number' ? bufferDays : Number(process.env.WARRANTY_REMINDER_DAYS_BEFORE || 7);
        const daysBuffer = Number.isFinite(reminderBuffer) && reminderBuffer > 0 ? reminderBuffer : 7;

        const expiryDate = new Date(warranty.expiryDate);
        const reminderTime = new Date(expiryDate.getTime() - daysBuffer * MS_IN_DAY);
        const delay = reminderTime.getTime() - Date.now();

        if (delay <= 0) return; // Already expired or within buffer

        await emailQueue.add(
            'warranty.expiry',
            {
                template: 'warranty-expiry',
                orderId: orderId.toHexString(),
                lineItemId: lineItemId.toHexString(),
                userId: userId.toHexString(),
                expiryDate: expiryDate.toISOString(),
                providerName: warranty.providerName,
                supportContact: warranty.supportContact,
            },
            { delay }
        );

        logger.info({ orderId, lineItemId, expiryDate, daysBuffer }, 'Scheduled warranty expiry reminder');
    } catch (error) {
        logger.error({ error, orderId, lineItemId }, 'Failed to schedule warranty expiry reminder');
    }
}