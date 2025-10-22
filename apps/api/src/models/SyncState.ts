import mongoose, { Schema, Document } from 'mongoose';

export interface SyncStateType extends Document {
  vendorId: string;
  lastSyncAt: Date;
  lastRecordId?: string;
}

const SyncStateSchema = new Schema<SyncStateType>({
  vendorId: { type: String, required: true, unique: true, index: true },
  lastSyncAt: { type: Date, default: null },
  lastRecordId: { type: String, default: null },
});

export const SyncState = mongoose.model<SyncStateType>('SyncState', SyncStateSchema);

// Usage in ERP sync logic:
// 1. Before sync, read SyncState for vendor to get lastSyncAt/lastRecordId
// 2. Only process records newer than lastSyncAt/lastRecordId
// 3. After successful sync, update SyncState
// 4. If sync fails, do not update SyncState (retry next time)
