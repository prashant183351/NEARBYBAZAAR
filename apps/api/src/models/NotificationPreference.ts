import { Schema, model, Types } from 'mongoose';

export type NotificationType =
    | 'order_received'
    | 'order_shipped'
    | 'stock_low'
    | 'stock_out'
    | 'price_updated'
    | 'supplier_sync_failed'
    | 'compliance_required'
    | 'sku_mapping_conflict';

export type NotificationChannel = 'email' | 'in_app' | 'web_push' | 'sms';

export interface NotificationPreference {
    _id?: Types.ObjectId;
    userId: Types.ObjectId; // vendor or supplier
    userType: 'vendor' | 'supplier';
    notificationType: NotificationType;
    channels: NotificationChannel[];
    enabled: boolean;
    // Aggregation settings
    aggregateEnabled?: boolean;
    aggregateIntervalMinutes?: number; // e.g., 60 for hourly summary
    createdAt: Date;
    updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<NotificationPreference>({
    userId: { type: Schema.Types.ObjectId, required: true },
    userType: { type: String, enum: ['vendor', 'supplier'], required: true },
    notificationType: {
        type: String,
        enum: [
            'order_received',
            'order_shipped',
            'stock_low',
            'stock_out',
            'price_updated',
            'supplier_sync_failed',
            'compliance_required',
            'sku_mapping_conflict',
        ],
        required: true,
    },
    channels: [{
        type: String,
        enum: ['email', 'in_app', 'web_push', 'sms'],
    }],
    enabled: { type: Boolean, default: true },
    aggregateEnabled: { type: Boolean, default: false },
    aggregateIntervalMinutes: { type: Number, default: 60 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

NotificationPreferenceSchema.index({ userId: 1, userType: 1, notificationType: 1 }, { unique: true });

export default model<NotificationPreference>('NotificationPreference', NotificationPreferenceSchema);
