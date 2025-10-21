import { Request, Response } from 'express';
import { apiSuccess } from '../utils/apiResponse';

export const health = (_req: Request, res: Response) => {
    res.json(apiSuccess({ status: 'ok', timestamp: new Date().toISOString() }));
};
