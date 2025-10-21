import { Router } from 'express';
import { Wallet } from '../models/Wallet';

const router = Router();

// Deposit funds into wallet
router.post('/deposit', async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || !amount || !description) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    const walletInstance = wallet as typeof Wallet.prototype;
    await walletInstance.deposit(amount, description);

    res.status(200).json({ message: 'Deposit successful.', wallet: walletInstance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;