import { Schema, model, Document, Types } from 'mongoose';
import { ulid } from 'ulid';

/**
 * Payment status enum
 */
export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    REQUIRES_ACTION = 'requires_action',
    REQUIRES_CAPTURE = 'requires_capture',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded',
    PARTIALLY_REFUNDED = 'partially_refunded',
}

/**
 * Payment gateway enum
 */
export enum PaymentGateway {
    PHONEPE = 'phonepe',
    RAZORPAY = 'razorpay',
    STRIPE = 'stripe',
    COD = 'cod',
    WALLET = 'wallet',
}

/**
 * Refund interface
 */
export interface IRefund {
    refundId: string;
    amount: number;
    reason?: string;
    status: 'pending' | 'succeeded' | 'failed';
    gatewayRefundId?: string;
    createdAt: Date;
    processedAt?: Date;
    metadata?: Record<string, any>;
}

/**
 * Payment intent interface
 */
export interface IPaymentIntent extends Document {
    paymentIntentId: string; // ULID
    orderId: Types.ObjectId;
    userId: Types.ObjectId;
    vendorId?: Types.ObjectId;
    amount: number;
    currency: string;
    status: PaymentStatus;
    gateway: PaymentGateway;
    gatewayTransactionId?: string;
    gatewayOrderId?: string;
    gatewayPaymentMethod?: string;
    capturedAmount: number;
    refundedAmount: number;
    gatewayResponse?: Record<string, any>;
    gatewayError?: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
    refunds: IRefund[];
    metadata?: Record<string, any>;
    expiresAt?: Date;
    capturedAt?: Date;
    failedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    
    // Methods
    canCapture(): boolean;
    canRefund(): boolean;
    capture(amount?: number): Promise<IPaymentIntent>;
    refund(amount: number, reason?: string): Promise<IPaymentIntent>;
    cancel(): Promise<IPaymentIntent>;
}

/**
 * Refund schema
 */
const refundSchema = new Schema<IRefund>(
    {
        refundId: {
            type: String,
            required: true,
            default: () => ulid(),
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        reason: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'succeeded', 'failed'],
            default: 'pending',
            required: true,
        },
        gatewayRefundId: {
            type: String,
            trim: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
        processedAt: {
            type: Date,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    { _id: false }
);

/**
 * Payment intent schema
 */
const paymentIntentSchema = new Schema<IPaymentIntent>(
    {
        paymentIntentId: {
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
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: 'Vendor',
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            required: true,
            default: 'INR',
            uppercase: true,
        },
        status: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.PENDING,
            required: true,
            index: true,
        },
        gateway: {
            type: String,
            enum: Object.values(PaymentGateway),
            required: true,
            index: true,
        },
        gatewayTransactionId: {
            type: String,
            trim: true,
            sparse: true,
            index: true,
        },
        gatewayOrderId: {
            type: String,
            trim: true,
            sparse: true,
        },
        gatewayPaymentMethod: {
            type: String,
            trim: true,
        },
        capturedAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        refundedAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        gatewayResponse: {
            type: Schema.Types.Mixed,
        },
        gatewayError: {
            code: {
                type: String,
                trim: true,
            },
            message: {
                type: String,
                trim: true,
            },
            details: {
                type: Schema.Types.Mixed,
            },
        },
        refunds: {
            type: [refundSchema],
            default: [],
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        expiresAt: {
            type: Date,
            index: true,
        },
        capturedAt: {
            type: Date,
            index: true,
        },
        failedAt: {
            type: Date,
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
paymentIntentSchema.index({ orderId: 1, status: 1 });
paymentIntentSchema.index({ userId: 1, createdAt: -1 });
paymentIntentSchema.index({ vendorId: 1, status: 1, createdAt: -1 });
paymentIntentSchema.index({ gateway: 1, gatewayTransactionId: 1 });
paymentIntentSchema.index({ status: 1, expiresAt: 1 });

/**
 * Pre-save hook: Set expiry for pending intents
 */
paymentIntentSchema.pre('save', function (next) {
    if (this.isNew && this.status === PaymentStatus.PENDING && !this.expiresAt) {
        // Set expiry to 15 minutes from now
        this.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    }
    next();
});

/**
 * Method: Check if payment can be captured
 */
paymentIntentSchema.methods.canCapture = function (): boolean {
    return (
        this.status === PaymentStatus.REQUIRES_CAPTURE ||
        (this.status === PaymentStatus.PROCESSING && this.gateway !== PaymentGateway.COD)
    );
};

/**
 * Method: Check if payment can be refunded
 */
paymentIntentSchema.methods.canRefund = function (): boolean {
    return (
        (this.status === PaymentStatus.SUCCEEDED ||
            this.status === PaymentStatus.PARTIALLY_REFUNDED) &&
        this.capturedAmount > this.refundedAmount
    );
};

/**
 * Method: Capture payment
 */
paymentIntentSchema.methods.capture = async function (
    amount?: number
): Promise<IPaymentIntent> {
    if (!this.canCapture()) {
        throw new Error(`Cannot capture payment in status: ${this.status}`);
    }
    
    const captureAmount = amount || this.amount;
    
    if (captureAmount > this.amount) {
        throw new Error('Capture amount exceeds payment amount');
    }
    
    // TODO: Integrate with actual payment gateway
    this.capturedAmount = captureAmount;
    this.status = PaymentStatus.SUCCEEDED;
    this.capturedAt = new Date();
    
    return this.save();
};

/**
 * Method: Refund payment
 */
paymentIntentSchema.methods.refund = async function (
    amount: number,
    reason?: string
): Promise<IPaymentIntent> {
    if (!this.canRefund()) {
        throw new Error(`Cannot refund payment in status: ${this.status}`);
    }
    
    const availableForRefund = this.capturedAmount - this.refundedAmount;
    
    if (amount > availableForRefund) {
        throw new Error(
            `Refund amount ${amount} exceeds available amount ${availableForRefund}`
        );
    }
    
    // Create refund record
    const refund: IRefund = {
        refundId: ulid(),
        amount,
        reason,
        status: 'pending',
        createdAt: new Date(),
    };
    
    this.refunds.push(refund);
    
    // TODO: Integrate with actual payment gateway
    // For now, mark as succeeded immediately
    refund.status = 'succeeded';
    refund.processedAt = new Date();
    
    this.refundedAmount += amount;
    
    // Update status
    if (this.refundedAmount >= this.capturedAmount) {
        this.status = PaymentStatus.REFUNDED;
    } else if (this.refundedAmount > 0) {
        this.status = PaymentStatus.PARTIALLY_REFUNDED;
    }
    
    return this.save();
};

/**
 * Method: Cancel payment intent
 */
paymentIntentSchema.methods.cancel = async function (): Promise<IPaymentIntent> {
    if (
        this.status !== PaymentStatus.PENDING &&
        this.status !== PaymentStatus.REQUIRES_ACTION
    ) {
        throw new Error(`Cannot cancel payment in status: ${this.status}`);
    }
    
    this.status = PaymentStatus.CANCELLED;
    return this.save();
};

/**
 * Virtual: Available refund amount
 */
paymentIntentSchema.virtual('availableRefundAmount').get(function () {
    return this.capturedAmount - this.refundedAmount;
});

/**
 * Virtual: Is expired
 */
paymentIntentSchema.virtual('isExpired').get(function () {
    return this.expiresAt && this.expiresAt < new Date();
});

export const PaymentIntent = model<IPaymentIntent>(
    'PaymentIntent',
    paymentIntentSchema
);
