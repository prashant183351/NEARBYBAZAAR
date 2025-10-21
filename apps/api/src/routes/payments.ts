import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { createPaymentRequest, toPaise, verifyCallbackSignature } from '../services/payment/phonepe';
import { PaymentIntent, PaymentGateway, PaymentStatus } from '../models/PaymentIntent';
import { Types } from 'mongoose';
import { refundOrder } from '../controllers/payments';

const router = Router();

const InitSchema = z.object({
  paymentIntentId: z.string().min(8),
});

// Initiate PhonePe payment for an existing PaymentIntent
 router.post('/phonepe/init', idempotency({ required: false }), validate(InitSchema), async (req, res) => {
  const { paymentIntentId } = req.body as z.infer<typeof InitSchema>;

  const pi = await PaymentIntent.findOne({ paymentIntentId });
  if (!pi) return res.status(404).json({ success: false, error: { message: 'PaymentIntent not found' } });
  if (pi.gateway !== PaymentGateway.PHONEPE) return res.status(400).json({ success: false, error: { message: 'Wrong gateway' } });
  if (!(pi.status === PaymentStatus.PENDING || pi.status === PaymentStatus.PROCESSING || pi.status === PaymentStatus.REQUIRES_ACTION)) {
    return res.status(400).json({ success: false, error: { message: `Cannot init in status ${pi.status}` } });
  }

  const resp = await createPaymentRequest({
    merchantTransactionId: pi.paymentIntentId,
    amountInPaise: toPaise(pi.amount),
    merchantUserId: (pi.userId as Types.ObjectId).toHexString(),
  });

  // Store redirect URL in metadata for traceability (no secrets)
  pi.metadata = { ...(pi.metadata || {}), redirectUrl: resp.url };
  pi.status = PaymentStatus.PROCESSING;
  await pi.save();

  return res.json({ success: true, data: { url: resp.url } });
});

// PhonePe callback/webhook handler
router.post('/phonepe/callback', async (req, res) => {
  const raw = (req as any).rawBody || JSON.stringify(req.body || {});
  const ok = verifyCallbackSignature(req.headers as any, raw);
  if (!ok) return res.status(401).json({ success: false, error: { message: 'Invalid signature' } });

  // Basic schema per PhonePe callback
  const schema = z.object({
    code: z.string(),
    success: z.boolean(),
    data: z.object({
      merchantId: z.string(),
      merchantTransactionId: z.string(),
      transactionId: z.string().optional(),
      amount: z.number().optional(),
      state: z.string().optional(),
    }),
    message: z.string().optional(),
  });

  const parsed = schema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { message: 'Invalid payload' } });
  }

  const mtid = parsed.data.data.merchantTransactionId;
  const pi = await PaymentIntent.findOne({ paymentIntentId: mtid });
  if (!pi) return res.status(404).json({ success: false, error: { message: 'PaymentIntent not found' } });

  if (parsed.data.success) {
    pi.status = PaymentStatus.SUCCEEDED;
    pi.capturedAmount = pi.amount;
    pi.capturedAt = new Date();
    pi.gatewayTransactionId = parsed.data.data.transactionId;
  } else {
    pi.status = PaymentStatus.FAILED;
    pi.failedAt = new Date();
    pi.gatewayError = { code: parsed.data.code, message: parsed.data.message || 'Payment failed' } as any;
  }
  await pi.save();

  // PhonePe expects 200 OK with some response body; keep it simple
  return res.json({ success: true });
});

// Refund endpoint
router.post('/refund', refundOrder);
export default router;
