import { Router } from 'express';
import { overrideSlug, overrideSEO } from '../controllers/admin/overrides';
import { listDisputes } from '../controllers/disputes';
import { authorize } from '../middleware/auth';

const router = Router();

router.put('/overrideSlug', ...overrideSlug);
router.put('/overrideSEO', ...overrideSEO);
// Admin disputes list (admin only)
router.get('/disputes', authorize({ action: 'manage', resource: 'admin', requireAuth: true }) as any, listDisputes as any);

export default router;
