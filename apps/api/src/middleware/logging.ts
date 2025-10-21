import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import pinoHttp from 'pino-http';
import { createLogger } from '@nearbybazaar/lib';

/**
 * Logger instance for the API
 */
export const logger = createLogger('api');

/**
 * Extend Express Request with custom properties
 */
declare global {
    namespace Express {
        interface Request {
            id: string;
            log: typeof logger;
        }
    }
}

/**
 * Generate or extract request ID
 */
function getRequestId(req: Request): string {
    // Check for incoming X-Request-Id header
    const incomingId = req.headers['x-request-id'];
    if (incomingId && typeof incomingId === 'string') {
        return incomingId;
    }
    
    // Generate new UUID
    return randomUUID();
}

/**
 * Pino HTTP logger middleware
 * Logs all HTTP requests with request ID
 */
export const pinoHttpLogger = pinoHttp({
    logger,
    // Generate request ID
    genReqId: (req) => getRequestId(req as Request),
    // Custom serializers
    serializers: {
        req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            params: req.params,
            // Redact body for sensitive endpoints
            body: req.url?.includes('login') || req.url?.includes('signup') || req.url?.includes('password')
                ? '[REDACTED]'
                : req.body,
            headers: {
                host: req.headers.host,
                'user-agent': req.headers['user-agent'],
                'content-type': req.headers['content-type'],
                origin: req.headers.origin,
            },
            remoteAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        }),
        res: (res) => ({
            statusCode: res.statusCode,
            headers: {
                'content-type': res.getHeader('content-type'),
                'content-length': res.getHeader('content-length'),
            },
        }),
    },
    // Custom log message
    customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        if (res.statusCode >= 300) return 'info';
        return 'info';
    },
    // Automatically log requests
    autoLogging: {
        ignore: (req) => {
            // Don't log health checks
            return req.url === '/health' || req.url === '/livez' || req.url === '/readyz';
        },
    },
});

/**
 * Middleware to attach request ID and logger to request object
 * Must be applied after pinoHttpLogger
 */
export function attachRequestContext(req: Request, res: Response, next: NextFunction) {
    // Attach request ID to request object
    req.id = res.getHeader('x-request-id') as string || getRequestId(req);
    
    // Set response header
    res.setHeader('X-Request-Id', req.id);
    
    // Attach logger to request (already done by pino-http, but make it explicit)
    req.log = req.log || logger.child({ requestId: req.id });
    
    next();
}

/**
 * Log middleware for debugging
 * Use this selectively for routes that need detailed logging
 */
export function logRequest(message?: string) {
    return (req: Request, _res: Response, next: NextFunction) => {
        req.log.debug({
            msg: message || 'Request received',
            method: req.method,
            path: req.path,
            query: req.query,
            params: req.params,
            user: (req as any).user?.id,
        });
        next();
    };
}

/**
 * Log errors with full context
 */
export function logError(err: Error, req: Request, _res: Response, next: NextFunction) {
    req.log.error({
        err,
        requestId: req.id,
        method: req.method,
        url: req.url,
        user: (req as any).user?.id,
        body: req.body,
    }, 'Request error');
    
    next(err);
}

/**
 * Helper to create a child logger with additional context
 */
export function createChildLogger(context: Record<string, any>) {
    return logger.child(context);
}
