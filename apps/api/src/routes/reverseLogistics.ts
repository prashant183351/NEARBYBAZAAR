import { Router } from 'express';
import { bookReturnPickup } from '../services/shipping/reverse';
import { logger } from '../utils/logger';

const router = Router();

// POST /v1/returns/:returnId/pickup (book pickup)
router.post('/returns/:returnId/pickup', async (req, res) => {
  try {
    const { returnId } = req.params;
    const result = await bookReturnPickup(returnId);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Return pickup error', err);
    res.status(500).json({ success: false, error: 'Failed to schedule pickup' });
  }
});

export default router;
