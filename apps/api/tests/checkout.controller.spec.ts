import {
  AddToCartBody,
  SetAddressBody,
  ShippingBody,
  PayBody,
  ConfirmBody,
} from '../src/controllers/checkout';

describe('Checkout controller schemas', () => {
  it('parses AddToCartBody', () => {
    const data = AddToCartBody.parse({
      itemId: '650000000000000000000000',
      itemType: 'product',
      quantity: 1,
      price: 123.45,
    });
    expect(data.price).toBe(123.45);
  });

  it('parses SetAddressBody with inline shippingAddress', () => {
    const d = SetAddressBody.parse({
      shippingAddress: {
        fullName: 'Test',
        phone: '9999999999',
        addressLine1: 'Line 1',
        city: 'City',
        state: 'State',
        pincode: '560001',
        country: 'IN',
      },
    });
    expect(d.shippingAddress?.fullName).toBe('Test');
  });

  it('parses ShippingBody selection optional', () => {
    const d = ShippingBody.parse({});
    expect(d.selectOption).toBeUndefined();
  });

  it('parses PayBody default gateway', () => {
    const d = PayBody.parse({});
    expect(d.gateway).toBeDefined();
  });

  it('parses ConfirmBody', () => {
    const d = ConfirmBody.parse({
      paymentIntentId: '01J8ZQJ7F3YYYYYYYYYYYYYY',
      simulateSuccess: true,
    });
    expect(d.simulateSuccess).toBe(true);
  });
});
