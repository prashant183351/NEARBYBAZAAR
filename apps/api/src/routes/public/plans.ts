import { Router } from 'express';
import { listPlans } from '../../controllers/plans';

const router = Router();

// GET /v1/plans - List all active plans
router.get('/v1/plans', listPlans);

export default router;
