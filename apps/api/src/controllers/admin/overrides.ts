import { Request, Response } from 'express';
import { Product } from '../../models/Product';
import { Service } from '../../models/Service';
import { Classified } from '../../models/Classified';
import { AuditLog } from '../../models/AuditLog';
import { requireAuth } from '../../auth/guard';
import type { Action, Resource } from '../../rbac/ability';

// Helper to log admin override
async function logOverride(userId: string, resource: string, resourceId: string, field: string, oldValue: any, newValue: any) {
    await AuditLog.create({
        user: userId,
        action: 'admin_override',
        resource,
        resourceId,
        details: { field, oldValue, newValue },
    });
}

// Generic override handler
async function overrideField(Model: any, req: Request, res: Response, resource: string, field: string) {
    const { id, value } = req.body;
    const doc = await Model.findById(id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const oldValue = doc[field];
    doc[field] = value;
    await doc.save();
    await logOverride((req as any).user?.id, resource, id, field, oldValue, value);
    res.json({ success: true, [field]: value });
}

// RBAC: Only admin can access
export const overrideSlug = [
    requireAuth('manage' as Action, 'admin' as Resource),
    async (req: Request, res: Response) => {
        const { type } = req.body;
        if (type === 'product') return overrideField(Product, req, res, 'product', 'slug');
        if (type === 'service') return overrideField(Service, req, res, 'service', 'slug');
        if (type === 'classified') return overrideField(Classified, req, res, 'classified', 'slug');
        res.status(400).json({ error: 'Invalid type' });
    }
];

export const overrideSEO = [
    requireAuth('manage' as Action, 'admin' as Resource),
    async (req: Request, res: Response) => {
        const { type, field } = req.body;
        if (!['metaTitle', 'metaDescription'].includes(field)) return res.status(400).json({ error: 'Invalid field' });
        if (type === 'product') return overrideField(Product, req, res, 'product', field);
        if (type === 'service') return overrideField(Service, req, res, 'service', field);
        if (type === 'classified') return overrideField(Classified, req, res, 'classified', field);
        res.status(400).json({ error: 'Invalid type' });
    }
];
