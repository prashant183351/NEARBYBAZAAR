import cors from 'cors';

/**
 * Parse allowed origins from environment variable
 * Supports comma-separated list or wildcard
 */
function getAllowedOrigins(): string[] | string {
  const originsEnv = process.env.CORS_ALLOW_ORIGINS;

  // Explicit wildcard setting
  if (originsEnv === '*') {
    return '*';
  }

  // No configuration: use defaults based on environment
  if (!originsEnv) {
    // Development/test mode: allow all origins
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return '*';
    }
    // Production: default to specific origins
    return [
      'https://nearbybazaar.com',
      'https://www.nearbybazaar.com',
      'https://vendor.nearbybazaar.com',
      'https://admin.nearbybazaar.com',
    ];
  }

  // Parse comma-separated list
  return originsEnv.split(',').map((o) => o.trim());
}

/**
 * CORS middleware with configurable origins
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }

    // Wildcard mode (development only)
    if (allowedOrigins === '*') {
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Origin not allowed
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-Id',
    'X-Idempotency-Key',
  ],
  exposedHeaders: [
    'X-Request-Id',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After',
  ],
  maxAge: 86400, // 24 hours preflight cache
});

/**
 * Helper to check if origin is allowed (for logging/debugging)
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins === '*') return true;
  if (Array.isArray(allowedOrigins)) return allowedOrigins.includes(origin);

  return false;
}
