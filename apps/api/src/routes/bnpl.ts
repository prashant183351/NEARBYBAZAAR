import express from 'express';
import { initiateCreditCheck, createBnplOrder } from '../services/bnpl';

const router = express.Router();

// Endpoint to initiate a BNPL credit check
router.post('/bnpl/credit-check', async (req, res) => {
  const { buyerId, amount } = req.body;

  try {
    const result = await initiateCreditCheck(buyerId, amount);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in BNPL credit check endpoint:', error);
    res.status(500).json({ error: 'Failed to perform credit check' });
  }
});

// Endpoint to create a BNPL order
router.post('/bnpl/create-order', async (req, res) => {
  const { orderId, buyerId, amount, tenure } = req.body;

  try {
    const result = await createBnplOrder(orderId, buyerId, amount, tenure);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in BNPL create order endpoint:', error);
    res.status(500).json({ error: 'Failed to create BNPL order' });
  }
});

export default router;
