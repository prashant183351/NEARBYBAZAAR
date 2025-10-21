import { Schema, model, Document, Types } from 'mongoose';
import { ulid } from 'ulid';

/**
 * Shipment status enum
 */
export enum ShipmentStatus {
    PENDING = 'pending',
    LABEL_CREATED = 'label_created',
    PICKED_UP = 'picked_up',
    IN_TRANSIT = 'in_transit',
    OUT_FOR_DELIVERY = 'out_for_delivery',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    RETURNED = 'returned',
    CANCELLED = 'cancelled',
}

/**
 * Tracking event interface
 */
export interface ITrackingEvent {
    timestamp: Date;
    status: ShipmentStatus;
    location?: string;
    description: string;
    metadata?: Record<string, any>;
}

/**
 * Shipment interface
 */
export interface IShipment extends Document {
    shipmentId: string; // ULID
    orderId: Types.ObjectId;
    vendorId: Types.ObjectId;
    userId: Types.ObjectId;
    carrier: string;
    trackingNumber?: string;
    trackingUrl?: string;
    status: ShipmentStatus;
    shippingMethod: string;
    shippingCost: number;
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
        unit: 'cm' | 'in';
    };
    packageCount: number;
    shippingAddress: {
        fullName: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
    };
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    trackingEvents: ITrackingEvent[];
    notes?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    
    // Methods
    addTrackingEvent(event: Omit<ITrackingEvent, 'timestamp'>): Promise<IShipment>;
    updateStatus(status: ShipmentStatus, description?: string): Promise<IShipment>;
}

/**
 * Tracking event schema
 */
const trackingEventSchema = new Schema<ITrackingEvent>(
    {
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(ShipmentStatus),
            required: true,
        },
        location: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    { _id: false }
);

/**
 * Shipment schema
 */
const shipmentSchema = new Schema<IShipment>(
    {
        shipmentId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            default: () => ulid(),
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            index: true,
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        carrier: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        trackingNumber: {
            type: String,
            trim: true,
            sparse: true,
            index: true,
        },
        trackingUrl: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: Object.values(ShipmentStatus),
            default: ShipmentStatus.PENDING,
            required: true,
            index: true,
        },
        shippingMethod: {
            type: String,
            required: true,
            trim: true,
        },
        shippingCost: {
            type: Number,
            required: true,
            min: 0,
        },
        weight: {
            type: Number,
            min: 0,
        },
        dimensions: {
            length: {
                type: Number,
                min: 0,
            },
            width: {
                type: Number,
                min: 0,
            },
            height: {
                type: Number,
                min: 0,
            },
            unit: {
                type: String,
                enum: ['cm', 'in'],
                default: 'cm',
            },
        },
        packageCount: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        shippingAddress: {
            fullName: {
                type: String,
                required: true,
                trim: true,
            },
            phone: {
                type: String,
                required: true,
                trim: true,
            },
            addressLine1: {
                type: String,
                required: true,
                trim: true,
            },
            addressLine2: {
                type: String,
                trim: true,
            },
            city: {
                type: String,
                required: true,
                trim: true,
            },
            state: {
                type: String,
                required: true,
                trim: true,
            },
            pincode: {
                type: String,
                required: true,
                trim: true,
            },
            country: {
                type: String,
                required: true,
                default: 'IN',
                trim: true,
            },
        },
        estimatedDeliveryDate: {
            type: Date,
            index: true,
        },
        actualDeliveryDate: {
            type: Date,
            index: true,
        },
        trackingEvents: {
            type: [trackingEventSchema],
            default: [],
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

/**
 * Indexes
 */
shipmentSchema.index({ orderId: 1, status: 1 });
shipmentSchema.index({ vendorId: 1, status: 1, createdAt: -1 });
shipmentSchema.index({ userId: 1, createdAt: -1 });
shipmentSchema.index({ trackingNumber: 1, carrier: 1 });

/**
 * Pre-save hook: Add initial tracking event
 */
shipmentSchema.pre('save', function (next) {
    if (this.isNew && this.trackingEvents.length === 0) {
        this.trackingEvents.push({
            timestamp: new Date(),
            status: this.status,
            description: 'Shipment created',
        } as ITrackingEvent);
    }
    next();
});

/**
 * Method: Add tracking event
 */
shipmentSchema.methods.addTrackingEvent = async function (
    event: Omit<ITrackingEvent, 'timestamp'>
): Promise<IShipment> {
    this.trackingEvents.push({
        timestamp: new Date(),
        ...event,
    } as ITrackingEvent);
    
    // Update status to latest event status
    this.status = event.status;
    
    // If delivered, set actual delivery date
    if (event.status === ShipmentStatus.DELIVERED && !this.actualDeliveryDate) {
        this.actualDeliveryDate = new Date();
    }
    
    return this.save();
};

/**
 * Method: Update shipment status
 */
shipmentSchema.methods.updateStatus = async function (
    status: ShipmentStatus,
    description?: string
): Promise<IShipment> {
    return this.addTrackingEvent({
        status,
        description: description || `Status updated to ${status}`,
    });
};

/**
 * Virtual: Is delivered
 */
shipmentSchema.virtual('isDelivered').get(function () {
    return this.status === ShipmentStatus.DELIVERED;
});

/**
 * Virtual: Is in transit
 */
shipmentSchema.virtual('isInTransit').get(function () {
    return [
        ShipmentStatus.PICKED_UP,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.OUT_FOR_DELIVERY,
    ].includes(this.status);
});

/**
 * Virtual: Latest tracking event
 */
shipmentSchema.virtual('latestTracking').get(function () {
    return this.trackingEvents[this.trackingEvents.length - 1];
});

export const Shipment = model<IShipment>('Shipment', shipmentSchema);
