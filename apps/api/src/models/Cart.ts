import { Schema, model, Document, Types } from 'mongoose';

/**
 * Cart item interface
 */
export interface ICartItem {
    itemId: Types.ObjectId;
    itemType: 'product' | 'service';
    variantId?: string;
    quantity: number;
    price: number;
    discount?: number;
    tax?: number;
    metadata?: Record<string, any>;
}

/**
 * Cart interface
 */
export interface ICart extends Document {
    userId?: Types.ObjectId; // Optional: null for guest carts
    sessionId?: string; // For guest cart identification
    items: ICartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    couponCode?: string;
    shippingAddressId?: Types.ObjectId;
    billingAddressId?: Types.ObjectId;
    metadata?: Record<string, any>;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    
    // Methods
    addItem(item: Omit<ICartItem, 'metadata'>): Promise<ICart>;
    removeItem(itemId: Types.ObjectId): Promise<ICart>;
    updateItemQuantity(itemId: Types.ObjectId, quantity: number): Promise<ICart>;
    clear(): Promise<ICart>;
    calculateTotals(): void;
}

/**
 * Cart item schema
 */
const cartItemSchema = new Schema<ICartItem>(
    {
        itemId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'items.itemType',
        },
        itemType: {
            type: String,
            enum: ['product', 'service'],
            required: true,
        },
        variantId: {
            type: String,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        discount: {
            type: Number,
            min: 0,
            default: 0,
        },
        tax: {
            type: Number,
            min: 0,
            default: 0,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    { _id: false }
);

/**
 * Cart schema
 */
const cartSchema = new Schema<ICart>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            sparse: true, // Allow null for guest carts
            index: true,
        },
        sessionId: {
            type: String,
            sparse: true, // For guest cart tracking
            index: true,
        },
        items: {
            type: [cartItemSchema],
            default: [],
        },
        subtotal: {
            type: Number,
            default: 0,
            min: 0,
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        tax: {
            type: Number,
            default: 0,
            min: 0,
        },
        total: {
            type: Number,
            default: 0,
            min: 0,
        },
        couponCode: {
            type: String,
            trim: true,
            uppercase: true,
        },
        shippingAddressId: {
            type: Schema.Types.ObjectId,
            ref: 'Address',
        },
        billingAddressId: {
            type: Schema.Types.ObjectId,
            ref: 'Address',
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
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
cartSchema.index({ userId: 1, createdAt: -1 });
cartSchema.index({ sessionId: 1, createdAt: -1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

/**
 * Pre-save hook: Set expiration and calculate totals
 */
cartSchema.pre('save', function (next) {
    // Set expiry to 7 days from now if not set
    if (!this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    
    // Recalculate totals
    this.calculateTotals();
    
    next();
});

/**
 * Method: Calculate cart totals
 */
cartSchema.methods.calculateTotals = function (): void {
    this.subtotal = this.items.reduce(
        (sum: number, item: ICartItem) => sum + item.price * item.quantity,
        0
    );
    
    this.discount = this.items.reduce(
        (sum: number, item: ICartItem) => sum + (item.discount || 0) * item.quantity,
        0
    );
    
    this.tax = this.items.reduce(
        (sum: number, item: ICartItem) => sum + (item.tax || 0) * item.quantity,
        0
    );
    
    this.total = this.subtotal - this.discount + this.tax;
};

/**
 * Method: Add item to cart
 */
cartSchema.methods.addItem = async function (
    item: Omit<ICartItem, 'metadata'>
): Promise<ICart> {
    // Check if item already exists
    const existingIndex = this.items.findIndex(
        (i: ICartItem) =>
            i.itemId.equals(item.itemId) &&
            i.itemType === item.itemType &&
            i.variantId === item.variantId
    );
    
    if (existingIndex >= 0) {
        // Update quantity
        this.items[existingIndex].quantity += item.quantity;
        this.items[existingIndex].price = item.price; // Update to latest price
    } else {
        // Add new item
        this.items.push(item as ICartItem);
    }
    
    // Reset expiry
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    return this.save();
};

/**
 * Method: Remove item from cart
 */
cartSchema.methods.removeItem = async function (
    itemId: Types.ObjectId
): Promise<ICart> {
    this.items = this.items.filter((item: ICartItem) => !item.itemId.equals(itemId));
    return this.save();
};

/**
 * Method: Update item quantity
 */
cartSchema.methods.updateItemQuantity = async function (
    itemId: Types.ObjectId,
    quantity: number
): Promise<ICart> {
    const item = this.items.find((i: ICartItem) => i.itemId.equals(itemId));
    
    if (!item) {
        throw new Error('Item not found in cart');
    }
    
    if (quantity <= 0) {
        return this.removeItem(itemId);
    }
    
    item.quantity = quantity;
    
    // Reset expiry
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    return this.save();
};

/**
 * Method: Clear cart
 */
cartSchema.methods.clear = async function (): Promise<ICart> {
    this.items = [];
    this.couponCode = undefined;
    this.shippingAddressId = undefined;
    this.billingAddressId = undefined;
    return this.save();
};

/**
 * Virtual: Item count
 */
cartSchema.virtual('itemCount').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

/**
 * Static method: Find or create cart
 */
cartSchema.statics.findOrCreate = async function (
    userId?: Types.ObjectId,
    sessionId?: string
): Promise<ICart> {
    const query = userId ? { userId } : { sessionId };
    
    let cart = await this.findOne(query);
    
    if (!cart) {
        cart = await this.create({
            userId,
            sessionId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
    }
    
    return cart;
};

export const Cart = model<ICart>('Cart', cartSchema);
