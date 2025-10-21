import { Router } from 'express';
import * as plans from '../controllers/plans';

const router = Router();

router.get('/', plans.listPlans);
router.get('/:id', plans.getPlan);
router.post('/', plans.createPlan);
router.put('/:id', plans.updatePlan);
router.delete('/:id', plans.deletePlan);

import { subscribePlan, subscriptionWebhook } from '../controllers/subscription';
router.post('/subscribe', subscribePlan);
router.post('/subscription/webhook', subscriptionWebhook);

export default router;
