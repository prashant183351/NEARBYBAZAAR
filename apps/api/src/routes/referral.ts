import express from 'express';
import { Referral } from '../models/Referral';

const router = express.Router();

// Generate referral code
router.post('/referral/generate', async (req, res) => {
  const { userId, type } = req.body;

  try {
    const referralCode = `${userId}-${type}-${Date.now().toString(36)}`;

    const referral = new Referral({
      referrerId: userId,
      referralCode,
      type,
    });

    await referral.save();

    res.status(200).json({ success: true, referralCode });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Redeem referral code
router.post('/referral/redeem', async (req, res) => {
  const { referralCode, referredId } = req.body;

  try {
    const referral = await Referral.findOne({ referralCode });

    if (!referral || referral.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Invalid or expired referral code' });
    }

    referral.referredId = referredId;
    referral.status = 'completed';
    referral.reward = referral.type === 'buyer' ? 100 : 500; // Example reward logic

    await referral.save();

    res
      .status(200)
      .json({ success: true, message: 'Referral redeemed successfully', reward: referral.reward });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
