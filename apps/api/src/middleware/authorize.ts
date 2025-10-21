import { Request, Response, NextFunction } from 'express';

export const authorize = (_req: Request, _res: Response, next: NextFunction) => {
    // Placeholder for authorization logic
    next();
};