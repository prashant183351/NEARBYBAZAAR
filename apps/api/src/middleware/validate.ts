import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodIssue } from 'zod';

function formatIssues(issues: ZodIssue[]) {
  return issues.map((i) => ({
    path: i.path.join('.'), // Ensure path is a string
    message: i.message,
    code: i.code,
  }));
}

// Adjust validate middleware to accept ZodObject schemas directly
export function validate(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body);
      Object.assign(req, parsed);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid request',
            issues: formatIssues(err.issues),
          },
        });
      }
      return next(err);
    }
  };
}
