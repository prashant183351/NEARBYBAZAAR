import crypto from 'crypto';
import axios from 'axios';
import { PaymentGateway } from '../../models/PaymentIntent';

interface PhonePeInitRequest {
  merchantId: string;
  merchantTransactionId: string;
  amount: number; // in paise
  merchantUserId?: string;
  redirectUrl?: string;
  redirectMode?: 'POST' | 'GET';
  callbackUrl: string;
  mobileNumber?: string;
  paymentInstrument?: {
    type: 'PAY_PAGE';
  };
}

interface PhonePeInitResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    instrumentResponse?: {
      redirectInfo?: { url: string; method: 'GET' | 'POST' };
    };
    merchantTransactionId?: string;
    transactionId?: string;
  };
}

export type PhonePeEnv = {
  merchantId: string;
  saltKey: string;
  saltIndex: string; // e.g. '1'
  callbackUrl: string;
  baseUrl?: string; // allow override for sandbox vs prod
};

export function getPhonePeEnv(): PhonePeEnv {
  const merchantId = process.env.PHONEPE_MERCHANT_ID || '';
  const saltKey = process.env.PHONEPE_SALT_KEY || '';
  const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
  const callbackUrl = process.env.PHONEPE_CALLBACK_URL || '';
  const baseUrl = process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';

  if (!merchantId || !saltKey || !callbackUrl) {
    throw new Error('PhonePe env not configured');
  }
  return { merchantId, saltKey, saltIndex, callbackUrl, baseUrl };
}

export function sha256Base64(input: string): string {
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  return hash;
}

export function hmacSha256(input: string, key: string): string {
  return crypto.createHmac('sha256', key).update(input).digest('hex');
}

// PhonePe requires: X-VERIFY header: sha256(base64(payload) + '/pg/v1/pay' + saltKey) + '###' + saltIndex
export function computeXVerify(encodedPayload: string, path: string, env: PhonePeEnv): string {
  const str = encodedPayload + path + env.saltKey;
  const hash = sha256Base64(str);
  return `${hash}###${env.saltIndex}`;
}

export async function createPaymentRequest(params: {
  merchantTransactionId: string;
  amountInPaise: number;
  merchantUserId?: string;
  mobileNumber?: string;
}): Promise<{ url: string; gateway: PaymentGateway }> {
  const env = getPhonePeEnv();
  const path = '/pg/v1/pay';
  const body: PhonePeInitRequest = {
    merchantId: env.merchantId,
    merchantTransactionId: params.merchantTransactionId,
    amount: params.amountInPaise,
    merchantUserId: params.merchantUserId,
    callbackUrl: env.callbackUrl,
    redirectMode: 'POST',
    paymentInstrument: { type: 'PAY_PAGE' },
  };

  const payload = Buffer.from(JSON.stringify(body)).toString('base64');
  const xVerify = computeXVerify(payload, path, env);

  const resp = await axios.post<PhonePeInitResponse>(
    `${env.baseUrl}${path}`,
    { request: payload },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': env.merchantId,
      },
      timeout: 10000,
      validateStatus: () => true,
    },
  );

  if (!resp.data?.success || !resp.data.data?.instrumentResponse?.redirectInfo?.url) {
    const code = resp.data?.code || 'UNKNOWN';
    const msg = resp.data?.message || 'Payment init failed';
    throw new Error(`PhonePe init failed: ${code} ${msg}`);
  }

  const url = resp.data.data.instrumentResponse.redirectInfo.url;
  return { url, gateway: PaymentGateway.PHONEPE };
}

// Verify callback signature from headers
export function verifyCallbackSignature(headers: Record<string, any>, bodyRaw: string): boolean {
  const env = getPhonePeEnv();
  const header = headers['x-verify'] || headers['X-VERIFY'] || '';
  if (typeof header !== 'string' || !header.includes('###')) return false;
  const [hash, idx] = header.split('###');
  if (idx !== env.saltIndex) return false;

  // For callbacks, PhonePe docs indicate verifying against body + path + salt
  // Often the path used is '/pg/v1/pay' or callback variant; for safety allow client to pass expected path.
  const expectedPath = headers['x-verify-path'] || '/pg/v1/pay';
  const computed = sha256Base64(bodyRaw + expectedPath + env.saltKey);
  return computed === hash;
}

export function toPaise(amountRupees: number): number {
  return Math.round(amountRupees * 100);
}

export function fromPaise(amountPaise: number): number {
  return Math.round(amountPaise) / 100;
}
