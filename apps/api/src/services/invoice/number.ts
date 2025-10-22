import { Types } from 'mongoose';
import { InvoiceSequence } from '../../models/InvoiceSequence';

export function getFY(date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-based
  const start = m >= 3 ? y : y - 1; // FY starts in April (month index 3)
  const end = start + 1;
  const pad2 = (n: number) => (n % 100).toString().padStart(2, '0');
  return `FY${pad2(start)}-${pad2(end)}`;
}

export async function nextInvoiceNumber(params: {
  vendorId?: string;
  prefix?: string;
  date?: Date;
}): Promise<string> {
  const fy = getFY(params.date);
  const filter: any = { fy };
  if (params.vendorId) filter.vendorId = new Types.ObjectId(params.vendorId);
  const update: any = { $inc: { current: 1 } };
  if (params.prefix) update.$set = { prefix: params.prefix };

  const doc = await InvoiceSequence.findOneAndUpdate(filter, update, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  const seq = doc?.current || 1;
  const prefix = doc?.prefix || params.prefix || 'INV';
  const vendorPart = params.vendorId ? params.vendorId.slice(-4).toUpperCase() : 'GEN';
  return `${prefix}-${fy}-${vendorPart}-${seq.toString().padStart(6, '0')}`;
}
