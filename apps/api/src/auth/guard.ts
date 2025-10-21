import { Request, Response, NextFunction } from 'express';
import { can, Action, Resource } from '../rbac/ability';

export function requireAuth(action: Action, resource: Resource) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user || !can(user, action, resource)) {
            return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
        }
        next();
    };
}
