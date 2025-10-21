import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();
const ERP_WEBHOOK_SECRET = process.env.ERP_WEBHOOK_SECRET || 'changeme';

function verifySignature(payload: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', ERP_WEBHOOK_SECRET);
    hmac.update(payload);
    const expected = hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Idempotency stub (replace with global system)
const seenIds = new Set<string>();
function isIdempotent(id: string): boolean {
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
}

router.post('/', (req: Request, res: Response) => {
    const signature = req.headers['x-erp-signature'] as string;
    const id = req.headers['x-erp-event-id'] as string;
    const payload = JSON.stringify(req.body);

    if (!verifySignature(payload, signature)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    if (!isIdempotent(id)) {
        return res.status(200).json({ status: 'duplicate' });
    }
    // ...process webhook event...
    res.json({ status: 'ok' });
});

export default router;
