import { Schema, model, Types } from 'mongoose';
import { NotificationType } from './NotificationPreference';

export interface Notification {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    userType: 'vendor' | 'supplier';
    type: NotificationType;
    title: string;
    message: string;
    data?: any; // additional context (e.g., orderId, productId)
    read: boolean;
    readAt?: Date;
    createdAt: Date;
}

const NotificationSchema = new Schema<Notification>({
    userId: { type: Schema.Types.ObjectId, required: true },
    userType: { type: String, enum: ['vendor', 'supplier'], required: true },
    type: {
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
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

NotificationSchema.index({ userId: 1, userType: 1, read: 1, createdAt: -1 });

export default model<Notification>('Notification', NotificationSchema);
