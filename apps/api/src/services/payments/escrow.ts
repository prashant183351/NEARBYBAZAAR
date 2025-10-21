// Escrow payment logic for high-risk transactions
import { Types } from 'mongoose';

export type EscrowState = 'HELD' | 'RELEASED' | 'REFUNDED';

export interface EscrowRecord {
  orderId: Types.ObjectId | string;
  amount: number;
  state: EscrowState;
  heldAt: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  autoReleaseAt?: Date;
}

// In-memory store for demo (replace with DB in prod)
const escrowStore: Record<string, EscrowRecord> = {};

export function createEscrow(orderId: Types.ObjectId | string, amount: number, autoReleaseDays = 7): EscrowRecord {
  const now = new Date();
  const record: EscrowRecord = {
    orderId,
    amount,
    state: 'HELD',
    heldAt: now,
    autoReleaseAt: new Date(now.getTime() + autoReleaseDays * 24 * 60 * 60 * 1000),
  };
  escrowStore[String(orderId)] = record;
  return record;
}

export function releaseEscrow(orderId: Types.ObjectId | string): EscrowRecord | null {
  const record = escrowStore[String(orderId)];
  if (record && record.state === 'HELD') {
    record.state = 'RELEASED';
    record.releasedAt = new Date();
  }
  return record || null;
}

export function refundEscrow(orderId: Types.ObjectId | string): EscrowRecord | null {
  const record = escrowStore[String(orderId)];
  if (record && record.state === 'HELD') {
    record.state = 'REFUNDED';
    record.refundedAt = new Date();
  }
  return record || null;
}

export function getEscrow(orderId: Types.ObjectId | string): EscrowRecord | null {
  return escrowStore[String(orderId)] || null;
}

// Auto-release funds after SLA if no dispute
export function autoReleaseDueEscrows(now = new Date()) {
  Object.values(escrowStore).forEach(record => {
    if (record.state === 'HELD' && record.autoReleaseAt && record.autoReleaseAt <= now) {
      releaseEscrow(record.orderId);
    }
  });
}
