import express, { Request, Response } from 'express';
import { CustomPaymentLink } from '../models/CustomPaymentLink';

const router = express.Router();

// Create a custom payment link
router.post('/custom-payment-links', async (req: Request, res: Response) => {
  try {
    const { vendorId, orderId, amount } = req.body;

    const paymentLink = new CustomPaymentLink({
      vendorId,
      orderId,
      amount,
    });

    await paymentLink.save();

    res.status(201).json(paymentLink);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

// Get a custom payment link by ID
router.get('/custom-payment-links/:id', async (req: Request, res: Response) => {
  try {
    const paymentLink = await CustomPaymentLink.findById(req.params.id);

    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    res.json(paymentLink);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment link' });
  }
});

// Update payment link status
router.patch('/custom-payment-links/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    const paymentLink = await CustomPaymentLink.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    res.json(paymentLink);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment link' });
  }
});

export default router;
