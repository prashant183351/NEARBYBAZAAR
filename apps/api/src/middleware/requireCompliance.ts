import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { enforceCompliance } from '../services/compliance';
import { AgreementType } from '../models/Agreement';

/**
 * Middleware to enforce compliance acceptance before allowing certain actions.
 * Usage: app.use('/api/orders', requireCompliance(['sla', 'compliance']), orderRoutes);
 */
export function requireCompliance(criticalTypes: AgreementType[] = ['sla', 'compliance']) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // @ts-ignore - assume auth middleware sets req.user
            const { userId, userType } = req.user;

            if (!userId || !userType) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            await enforceCompliance(new Types.ObjectId(userId), userType, criticalTypes);
            next();
        } catch (error: any) {
            res.status(403).json({
                error: error.message,
                code: 'COMPLIANCE_REQUIRED',
                message: 'You must accept the latest compliance agreements to proceed.',
            });
        }
    };
}
