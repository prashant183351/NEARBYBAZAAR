import { Router } from 'express';
import { RFQ } from '../models/RFQ';
import { RFQQuote } from '../models/RFQQuote';
import { RFQMessage } from '../models/RFQMessage';
import { emailQueue } from '../queues';
import { verifyRecaptcha } from '../middleware/recaptcha';

const router = Router();

// POST /v1/rfq - create RFQ
router.post('/', verifyRecaptcha, async (req, res) => {
  try {
    const { items, deliveryLocation, neededBy, notes, targetVendor, category } = req.body;
    const rfq = await RFQ.create({
      buyer: (req as any).user?.id,
      items,
      deliveryLocation,
      neededBy,
      notes,
      targetVendor,
      category,
    });
    // Notify target vendor or admin
    const to = process.env.ADMIN_EMAIL || 'admin@example.com';
    await emailQueue.add('send', {
      to,
      subject: 'New RFQ submitted',
      text: `RFQ ${rfq.id} submitted. Delivery: ${deliveryLocation}`,
    });
    res.json({ success: true, data: rfq });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// GET /v1/rfq/:id - get RFQ
router.get('/:id', async (req, res) => {
  const rfq = await RFQ.findById(req.params.id).populate('items.product');
  if (!rfq) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: rfq });
});

// GET /v1/rfq/:id/quotes - list quotes for RFQ
router.get('/:id/quotes', async (req, res) => {
  const quotes = await RFQQuote.find({ rfq: req.params.id }).populate('vendor');
  res.json({ success: true, data: quotes });
});

// GET /v1/rfq/vendor - list RFQs relevant to current vendor (targeted or broadcast)
router.get('/vendor', async (req, res) => {
  const vendorId = (req as any).user?.vendorId || req.query.vendorId;
  if (!vendorId) return res.json({ success: true, data: [] });
  const rfqs = await RFQ.find({
    status: 'open',
    $or: [
      { targetVendor: vendorId },
      { targetVendor: { $exists: false } },
    ],
  }).sort({ createdAt: -1 });
  res.json({ success: true, data: rfqs });
});

// POST /v1/rfq/:id/quote - vendor submits a quote
router.post('/:id/quote', async (req, res) => {
  try {
    const { unitPrice, minOrderQty, leadTimeDays, validUntil, notes } = req.body;
    const vendorId = (req as any).user?.vendorId || req.body.vendor; // fallback for now
    const quote = await RFQQuote.create({
      rfq: req.params.id,
      vendor: vendorId,
      unitPrice,
      minOrderQty,
      leadTimeDays,
      validUntil,
      notes,
    });
    // Notify buyer/admin
    const to = process.env.ADMIN_EMAIL || 'admin@example.com';
    await emailQueue.add('send', { to, subject: 'New RFQ Quote', text: `RFQ ${req.params.id} has a new quote` });
    res.json({ success: true, data: quote });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// POST /v1/rfq/quotes/:quoteId/messages - post a message in negotiation thread
router.post('/quotes/:quoteId/messages', async (req, res) => {
  try {
    const { message, authorType } = req.body;
    const msg = await RFQMessage.create({
      quote: req.params.quoteId,
      message,
      authorType: authorType || ((req as any).user?.vendorId ? 'vendor' : 'buyer'),
      author: (req as any).user?.id,
    });
    res.json({ success: true, data: msg });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// GET /v1/rfq/quotes/:quoteId/messages - list messages
router.get('/quotes/:quoteId/messages', async (req, res) => {
  const msgs = await RFQMessage.find({ quote: req.params.quoteId }).sort({ createdAt: 1 });
  res.json({ success: true, data: msgs });
});

// PUT /v1/rfq/quotes/:quoteId/accept - buyer accepts a quote
router.put('/quotes/:quoteId/accept', async (req, res) => {
  try {
    const quote = await RFQQuote.findById(req.params.quoteId);
    if (!quote) return res.status(404).json({ success: false, error: 'Not found' });
    quote.status = 'accepted';
    await quote.save();
    await RFQ.findByIdAndUpdate(quote.rfq, { status: 'closed' });
    res.json({ success: true, data: quote });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

export default router;