import { computeXVerify, getPhonePeEnv, createPaymentRequest, verifyCallbackSignature } from '../src/services/payment/phonepe';
import { PaymentGateway } from '../src/models/PaymentIntent';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PhonePe payments', () => {
  beforeAll(() => {
    process.env.PHONEPE_MERCHANT_ID = 'MERCHANT123';
    process.env.PHONEPE_SALT_KEY = 'somesaltkey';
    process.env.PHONEPE_SALT_INDEX = '1';
    process.env.PHONEPE_CALLBACK_URL = 'https://example.com/v1/payments/phonepe/callback';
    process.env.PHONEPE_BASE_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
  });

  it('computes X-VERIFY for init', () => {
    const env = getPhonePeEnv();
    const path = '/pg/v1/pay';
    const payload = Buffer.from(JSON.stringify({ merchantId: env.merchantId })).toString('base64');
    const xv = computeXVerify(payload, path, env);
    expect(xv).toMatch(/###1$/);
  });

  it('creates payment request (mocked)', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        code: 'SUCCESS',
        message: 'OK',
        data: {
          instrumentResponse: { redirectInfo: { url: 'https://pay.example.com/redirect', method: 'GET' } }
        }
      }
    } as any);

    const res = await createPaymentRequest({ merchantTransactionId: 'PI123', amountInPaise: 12345 });
    expect(res.url).toContain('https://');
    expect(res.gateway).toBe(PaymentGateway.PHONEPE);
  });

  it('verifies callback signature (happy)', () => {
    const env = getPhonePeEnv();
    const path = '/pg/v1/pay';
    const body = JSON.stringify({ success: true, code: 'SUCCESS', data: { merchantTransactionId: 'PI123' } });
    // Generate expected header using same function
    const hash = require('crypto').createHash('sha256').update(body + path + env.saltKey).digest('hex');
    const headers = { 'X-VERIFY': `${hash}###${env.saltIndex}`, 'x-verify-path': path } as any;
    expect(verifyCallbackSignature(headers, body)).toBe(true);
  });
});
