/**
 * Checkout API integration test (gated by RUN_INTEGRATION)
 */
import request from 'supertest';
import express from 'express';
import router from '../src/routes';

// Gate to avoid running unless explicitly enabled
const RUN = process.env.RUN_INTEGRATION === 'true';

const app = express();
app.use(express.json());
app.use('/v1', router);

const api = request(app);

const maybeIt = RUN ? it : it.skip;

describe('Checkout API', () => {
  maybeIt('runs add->address->shipping->pay->confirm', async () => {
    // 1) Get cart (establish session)
    const cartRes = await api.get('/v1/cart');
    expect(cartRes.status).toBe(200);
    const sessionId = cartRes.headers['x-session-id'];
    expect(sessionId).toBeTruthy();

    // 2) Add item
    const addRes = await api
      .post('/v1/cart')
      .set('X-Session-Id', sessionId as string)
      .send({
        itemId: '650000000000000000000000',
        itemType: 'product',
        quantity: 2,
        price: 100,
      });
    expect(addRes.status).toBe(201);
    expect(addRes.body.success).toBe(true);

    // 3) Shipping options
    const shippingOpts = await api
      .post('/v1/checkout/shipping')
      .set('X-Session-Id', sessionId as string)
      .send({});
    expect(shippingOpts.status).toBe(200);
    const options = shippingOpts.body.data.options;
    expect(options?.length).toBeGreaterThan(0);

    // 4) Select shipping
    const selected = options[0];
    const shippingSel = await api
      .post('/v1/checkout/shipping')
      .set('X-Session-Id', sessionId as string)
      .send({ selectOption: selected });
    expect(shippingSel.status).toBe(200);

    // 5) Pay
    const payRes = await api
      .post('/v1/checkout/pay')
      .set('X-Session-Id', sessionId as string)
      .send({ gateway: 'phonepe' });
    expect(payRes.status).toBe(201);
    const paymentIntentId = payRes.body.data.paymentIntent.paymentIntentId;
    expect(paymentIntentId).toBeTruthy();

    // 6) Confirm with idempotency
    const idemKey = 'test-idem-1234567890';
    const confirmRes = await api
      .post('/v1/checkout/confirm')
      .set('X-Idempotency-Key', idemKey)
      .send({ paymentIntentId, simulateSuccess: true });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.order).toBeTruthy();

    // 7) Replay should return cached
    const replay = await api
      .post('/v1/checkout/confirm')
      .set('X-Idempotency-Key', idemKey)
      .send({ paymentIntentId, simulateSuccess: true });
    expect(replay.status).toBe(200);
    expect(replay.headers['x-idempotency-replay']).toBe('true');
  });
});
