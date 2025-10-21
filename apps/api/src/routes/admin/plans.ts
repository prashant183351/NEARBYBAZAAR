import { Router } from 'express';
import { ClassifiedPlan, ClassifiedPlanZ } from '../../models/ClassifiedPlan';
import { AuditLog } from '../../models/AuditLog';
import { rbacGuard } from '../../middleware/rbac';

const router = Router();

// RBAC: Only admin can access
router.use(rbacGuard());

// Create plan
router.post('/', async (req, res) => {
    const parse = ClassifiedPlanZ.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.errors });
    const plan = await ClassifiedPlan.create(parse.data);
    await AuditLog.create({
        user: req.user?.id,
        action: 'plan_create',
        resource: 'ClassifiedPlan',
        resourceId: plan._id,
        details: parse.data,
        immutable: true,
    });
    res.status(201).json({ plan });
});

// Update plan
router.put('/:id', async (req, res) => {
    const parse = ClassifiedPlanZ.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.errors });
    const plan = await ClassifiedPlan.findByIdAndUpdate(req.params.id, parse.data, { new: true });
    if (!plan) return res.status(404).json({ error: 'Not found' });
    await AuditLog.create({
        user: req.user?.id,
        action: 'plan_update',
        resource: 'ClassifiedPlan',
        resourceId: plan._id,
        details: parse.data,
        immutable: true,
    });
    res.json({ plan });
});

// Delete plan
router.delete('/:id', async (req, res) => {
    const plan = await ClassifiedPlan.findByIdAndUpdate(req.params.id, { deleted: true }, { new: true });
    if (!plan) return res.status(404).json({ error: 'Not found' });
    await AuditLog.create({
        user: req.user?.id,
        action: 'plan_delete',
        resource: 'ClassifiedPlan',
        resourceId: plan._id,
        details: { deleted: true },
        immutable: true,
    });
    res.json({ plan });
});

export default router;
