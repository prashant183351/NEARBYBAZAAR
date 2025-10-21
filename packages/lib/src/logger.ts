import pino from 'pino';

/**
 * Create a pino logger instance with configuration based on environment
 */
export function createLogger(name = 'app') {
    const logLevel = process.env.LOG_LEVEL || 
        (process.env.NODE_ENV === 'production' ? 'info' : 
         process.env.NODE_ENV === 'test' ? 'error' : 'debug');

    return pino({
        name,
        level: logLevel,
        // Pretty print in development
        transport: process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' 
            ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                }
            }
            : undefined,
        // Structured JSON in production
        formatters: {
            level: (label) => {
                return { level: label };
            },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        // Redact sensitive fields
        redact: {
            paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'password',
                'secret',
                'token',
                '*.password',
                '*.secret',
                '*.token',
            ],
            censor: '[REDACTED]',
        },
    });
}

/**
 * Default logger instance
 */
export const logger = createLogger('nearbybazaar');
