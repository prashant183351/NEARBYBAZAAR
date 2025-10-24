import { Request, Response, NextFunction } from 'express';
import { sanitizeObject, SanitizePolicyMap } from '../utils/sanitize';

export interface SanitizeOptions {
  body?: SanitizePolicyMap;
  query?: SanitizePolicyMap;
  params?: SanitizePolicyMap;
}

// Always sanitize, never throw or return 400 (legacy behavior)
export const sanitize =
  (opts: SanitizeOptions = {}) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.body) req.body = sanitizeObject(req.body, opts.body);
      if (req.query) req.query = sanitizeObject(req.query, opts.query);
      if (req.params) req.params = sanitizeObject(req.params, opts.params);
    } catch (_err) {
      // On error, just leave input unchanged (legacy: never block request)
    }
    next();
  };
