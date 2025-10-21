import { Router, Request, Response } from 'express';
import * as compliance from '../services/compliance';
import { getDataStorageLocation } from '../services/compliance';
import { logger } from '../utils/logger';

const router = Router();

// GET /compliance/storage-location
router.get('/compliance/storage-location', (_req: Request, res: Response) => {
  res.json({ success: true, data: getDataStorageLocation() });
});

// Auth middleware should be applied in parent
router.post('/compliance/export', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id;
    const data = await compliance.exportUserData(userId);
    res.json({ success: true, data });
  } catch (err: any) {
    logger.error('Export error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/compliance/delete', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id;
    await compliance.deleteUserData(userId);
    res.json({ success: true });
  } catch (err: any) {
    logger.error('Delete error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/compliance/consent', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    // TODO: Implement consent logic
    res.json({ success: true });
  } catch (err: any) {
    logger.error('Consent error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
