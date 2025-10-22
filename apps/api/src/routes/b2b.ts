import { Router } from 'express';
import { User } from '../models/User';

const router = Router();

// POST /v1/b2b/register - upgrade to business account or register fields
router.post('/register', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.body.userId; // fallback for demo
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { companyName, gstin, pan, address } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isBusiness: true,
        businessProfile: { companyName, gstin, pan, address },
      },
      { new: true },
    );
    res.json({ success: true, data: user });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// GET /v1/b2b/me - business profile of current user
router.get('/me', async (req, res) => {
  const userId = (req as any).user?.id || req.query.userId; // fallback
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const user = await User.findById(userId).select('isBusiness businessProfile name email');
  res.json({ success: true, data: user });
});

export default router;
