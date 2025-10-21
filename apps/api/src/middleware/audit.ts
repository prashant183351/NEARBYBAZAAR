import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';

export async function logAudit(action: string, resource: string, resourceId?: string, details?: any) {
    // In real use, get user from req context
    await AuditLog.create({
        user: undefined, // TODO: attach user from req if available
        action,
        resource,
        resourceId,
        details,
    });
}

// Express middleware to log CRUD actions
type Handler = (req: Request, res: Response, next: NextFunction) => any;

export function withAudit(action: string, resource: string, handler: Handler): Handler {
    return async (req, res, next) => {
        const result = await handler(req, res, next);
        // Try to get resourceId from req.params or result
        const resourceId = req.params.id || (result && result._id);
        await logAudit(action, resource, resourceId, { body: req.body });
        return result;
    };
}
