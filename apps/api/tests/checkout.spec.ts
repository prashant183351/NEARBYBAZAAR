import { Types } from 'mongoose';
import { Address, AddressType } from '../src/models/Address';
import { Cart, ICartItem } from '../src/models/Cart';
import { Shipment, ShipmentStatus } from '../src/models/Shipment';
import { PaymentIntent, PaymentStatus, PaymentGateway } from '../src/models/PaymentIntent';
import { StockReservation, ReservationStatus } from '../src/models/StockReservation';

// Mock data
const mockUserId = new Types.ObjectId();
const mockVendorId = new Types.ObjectId();
const mockProductId = new Types.ObjectId();
const mockOrderId = new Types.ObjectId();

describe('Checkout Domain Models', () => {
  describe('Address Model', () => {
    it('should create a valid address', () => {
      const addressData = {
        userId: mockUserId,
        type: AddressType.HOME,
        fullName: 'John Doe',
        phone: '9876543210',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'IN',
      };

      const address = new Address(addressData);

      expect(address.userId).toEqual(mockUserId);
      expect(address.fullName).toBe('John Doe');
      expect(address.phone).toBe('9876543210');
      expect(address.isDefault).toBe(false);
    });

    it('should generate fullAddress virtual', () => {
      const address = new Address({
        userId: mockUserId,
        fullName: 'Jane Doe',
        phone: '9876543210',
        addressLine1: '456 Park Ave',
        addressLine2: 'Apt 2B',
        landmark: 'Near Central Park',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'IN',
      });

      const fullAddr = (address as any).fullAddress;
      expect(fullAddr).toContain('456 Park Ave');
      expect(fullAddr).toContain('Apt 2B');
      expect(fullAddr).toContain('Near Central Park');
      expect(fullAddr).toContain('Delhi');
    });

    it('should validate phone number format', () => {
      const address = new Address({
        userId: mockUserId,
        fullName: 'Test User',
        phone: 'invalid',
        addressLine1: '123 Test St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'IN',
      });

      const error = address.validateSync();
      expect(error?.errors.phone).toBeDefined();
    });

    it('should validate pincode format', () => {
      const address = new Address({
        userId: mockUserId,
        fullName: 'Test User',
        phone: '9876543210',
        addressLine1: '123 Test St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: 'invalid',
        country: 'IN',
      });

      const error = address.validateSync();
      expect(error?.errors.pincode).toBeDefined();
    });
  });

  describe('Cart Model', () => {
    it('should create an empty cart', () => {
      const cart = new Cart({
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(cart.items).toHaveLength(0);
      expect(cart.subtotal).toBe(0);
      expect(cart.total).toBe(0);
    });

    it('should calculate totals correctly', () => {
      const cart = new Cart({
        userId: mockUserId,
        items: [
          {
            itemId: mockProductId,
            itemType: 'product',
            quantity: 2,
            price: 100,
            discount: 10,
            tax: 18,
          },
        ] as ICartItem[],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      cart.calculateTotals();

      expect(cart.subtotal).toBe(200); // 2 * 100
      expect(cart.discount).toBe(20); // 2 * 10
      expect(cart.tax).toBe(36); // 2 * 18
      expect(cart.total).toBe(216); // 200 - 20 + 36
    });

    it('should calculate itemCount virtual', () => {
      const cart = new Cart({
        userId: mockUserId,
        items: [
          {
            itemId: new Types.ObjectId(),
            itemType: 'product',
            quantity: 2,
            price: 100,
          },
          {
            itemId: new Types.ObjectId(),
            itemType: 'product',
            quantity: 3,
            price: 50,
          },
        ] as ICartItem[],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect((cart as any).itemCount).toBe(5); // 2 + 3
    });

    it('should handle guest cart with sessionId', () => {
      const cart = new Cart({
        sessionId: 'test-session-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(cart.sessionId).toBe('test-session-123');
      expect(cart.userId).toBeUndefined();
    });
  });

  describe('Shipment Model', () => {
    it('should create a shipment with ULID', () => {
      const shipment = new Shipment({
        orderId: mockOrderId,
        vendorId: mockVendorId,
        userId: mockUserId,
        carrier: 'Delhivery',
        shippingMethod: 'Standard',
        shippingCost: 50,
        shippingAddress: {
          fullName: 'John Doe',
          phone: '9876543210',
          addressLine1: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'IN',
        },
      });

      expect(shipment.shipmentId).toBeDefined();
      expect(shipment.shipmentId).toHaveLength(26); // ULID length
      expect(shipment.status).toBe(ShipmentStatus.PENDING);
    });

    it('should check isDelivered virtual', () => {
      const shipment = new Shipment({
        orderId: mockOrderId,
        vendorId: mockVendorId,
        userId: mockUserId,
        carrier: 'Delhivery',
        shippingMethod: 'Standard',
        shippingCost: 50,
        status: ShipmentStatus.DELIVERED,
        shippingAddress: {
          fullName: 'John Doe',
          phone: '9876543210',
          addressLine1: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'IN',
        },
      });

      expect((shipment as any).isDelivered).toBe(true);
    });

    it('should check isInTransit virtual', () => {
      const shipment = new Shipment({
        orderId: mockOrderId,
        vendorId: mockVendorId,
        userId: mockUserId,
        carrier: 'Delhivery',
        shippingMethod: 'Standard',
        shippingCost: 50,
        status: ShipmentStatus.IN_TRANSIT,
        shippingAddress: {
          fullName: 'John Doe',
          phone: '9876543210',
          addressLine1: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'IN',
        },
      });

      expect((shipment as any).isInTransit).toBe(true);
    });
  });

  describe('PaymentIntent Model', () => {
    it('should create a payment intent with ULID', () => {
      const payment = new PaymentIntent({
        orderId: mockOrderId,
        userId: mockUserId,
        amount: 1000,
        currency: 'INR',
        gateway: PaymentGateway.PHONEPE,
      });

      expect(payment.paymentIntentId).toBeDefined();
      expect(payment.paymentIntentId).toHaveLength(26); // ULID length
      expect(payment.status).toBe(PaymentStatus.PENDING);
      expect(payment.capturedAmount).toBe(0);
      expect(payment.refundedAmount).toBe(0);
    });

    it('should check canCapture method', () => {
      const payment = new PaymentIntent({
        orderId: mockOrderId,
        userId: mockUserId,
        amount: 1000,
        gateway: PaymentGateway.PHONEPE,
        status: PaymentStatus.REQUIRES_CAPTURE,
      });

      expect(payment.canCapture()).toBe(true);

      payment.status = PaymentStatus.SUCCEEDED;
      expect(payment.canCapture()).toBe(false);
    });

    it('should check canRefund method', () => {
      const payment = new PaymentIntent({
        orderId: mockOrderId,
        userId: mockUserId,
        amount: 1000,
        gateway: PaymentGateway.PHONEPE,
        status: PaymentStatus.SUCCEEDED,
        capturedAmount: 1000,
        refundedAmount: 0,
      });

      expect(payment.canRefund()).toBe(true);

      payment.refundedAmount = 1000;
      expect(payment.canRefund()).toBe(false);
    });

    it('should calculate availableRefundAmount virtual', () => {
      const payment = new PaymentIntent({
        orderId: mockOrderId,
        userId: mockUserId,
        amount: 1000,
        gateway: PaymentGateway.PHONEPE,
        capturedAmount: 1000,
        refundedAmount: 300,
      });

      expect((payment as any).availableRefundAmount).toBe(700);
    });

    it('should check isExpired virtual', () => {
      const payment = new PaymentIntent({
        orderId: mockOrderId,
        userId: mockUserId,
        amount: 1000,
        gateway: PaymentGateway.PHONEPE,
        expiresAt: new Date(Date.now() - 1000), // Past date
      });

      expect((payment as any).isExpired).toBe(true);

      payment.expiresAt = new Date(Date.now() + 1000); // Future date
      expect((payment as any).isExpired).toBe(false);
    });
  });

  describe('StockReservation Model', () => {
    it('should create a reservation with ULID', () => {
      const reservation = new StockReservation({
        productId: mockProductId,
        quantity: 5,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      expect(reservation.reservationId).toBeDefined();
      expect(reservation.reservationId).toHaveLength(26); // ULID length
      expect(reservation.status).toBe(ReservationStatus.RESERVED);
    });

    it('should check isExpired method', () => {
      const reservation = new StockReservation({
        productId: mockProductId,
        quantity: 5,
        userId: mockUserId,
        expiresAt: new Date(Date.now() - 1000), // Past date
      });

      expect(reservation.isExpired()).toBe(true);

      reservation.expiresAt = new Date(Date.now() + 1000); // Future date
      expect(reservation.isExpired()).toBe(false);
    });

    it('should calculate timeRemaining virtual', () => {
      const futureTime = Date.now() + 10 * 60 * 1000; // 10 minutes
      const reservation = new StockReservation({
        productId: mockProductId,
        quantity: 5,
        userId: mockUserId,
        status: ReservationStatus.RESERVED,
        expiresAt: new Date(futureTime),
      });

      const timeRemaining = (reservation as any).timeRemaining;
      expect(timeRemaining).toBeGreaterThan(0);
      expect(timeRemaining).toBeLessThanOrEqual(10 * 60); // 10 minutes in seconds
    });

    it('should check isActive virtual', () => {
      const reservation = new StockReservation({
        productId: mockProductId,
        quantity: 5,
        userId: mockUserId,
        status: ReservationStatus.RESERVED,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      expect((reservation as any).isActive).toBe(true);

      reservation.status = ReservationStatus.CONFIRMED;
      expect((reservation as any).isActive).toBe(false);
    });

    it('should handle reservation with variant', () => {
      const reservation = new StockReservation({
        productId: mockProductId,
        variantId: 'size-M-color-blue',
        quantity: 2,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      expect(reservation.variantId).toBe('size-M-color-blue');
    });
  });

  describe('Integration Scenarios', () => {
    it('should represent a complete checkout flow', () => {
      // 1. Create cart with items
      const cart = new Cart({
        userId: mockUserId,
        items: [
          {
            itemId: mockProductId,
            itemType: 'product',
            quantity: 2,
            price: 500,
            tax: 90,
          },
        ] as ICartItem[],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      cart.calculateTotals();

      // 2. Create shipping address
      const address = new Address({
        userId: mockUserId,
        type: AddressType.SHIPPING,
        fullName: 'John Doe',
        phone: '9876543210',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'IN',
      });

      // 3. Reserve stock
      const reservation = new StockReservation({
        productId: mockProductId,
        quantity: 2,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      // 4. Create payment intent
      const payment = new PaymentIntent({
        orderId: mockOrderId,
        userId: mockUserId,
        amount: cart.total,
        currency: 'INR',
        gateway: PaymentGateway.PHONEPE,
      });

      // 5. Create shipment (after order confirmed)
      const shipment = new Shipment({
        orderId: mockOrderId,
        vendorId: mockVendorId,
        userId: mockUserId,
        carrier: 'Delhivery',
        shippingMethod: 'Standard',
        shippingCost: 50,
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country,
        },
      });

      // Assertions
      expect(cart.total).toBeGreaterThan(0);
      expect(address.pincode).toMatch(/^\d{6}$/);
      expect((reservation as any).isActive).toBe(true);
      expect(payment.canCapture()).toBe(false); // Needs to be in REQUIRES_CAPTURE status
      expect(shipment.status).toBe(ShipmentStatus.PENDING);
    });
  });
});
