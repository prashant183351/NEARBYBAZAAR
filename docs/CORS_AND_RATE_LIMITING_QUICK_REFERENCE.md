# CORS & Rate Limiting - Quick Reference

## Environment Variables

```bash
# CORS Configuration
CORS_ALLOW_ORIGINS=https://nearbybazaar.com,https://vendor.nearbybazaar.com  # Production
CORS_ALLOW_ORIGINS=*  # Development (allow all)

# Redis (required for rate limiting)
REDIS_URL=redis://localhost:6379
```

## Rate Limit Tiers

| Tier          | Limit    | Usage                       |
| ------------- | -------- | --------------------------- |
| Anonymous     | 100/min  | Default for unauthenticated |
| Authenticated | 300/min  | Logged-in users             |
| Admin         | 1000/min | Platform administrators     |
| Sensitive     | 10/min   | Auth endpoints              |
| Strict        | 5/min    | OTP endpoints               |
| Generous      | 500/min  | Public read endpoints       |

## Quick Usage

### Apply Standard Rate Limiting (Adaptive)

```typescript
import { rateLimit } from './middleware/rateLimit';

app.use(rateLimit()); // Auto-adjusts based on req.user.role
```

### Apply Preset Rate Limiters

```typescript
import { rateLimiters } from './middleware/rateLimit';

// Sensitive endpoints (10 req/min)
router.post('/signup', rateLimiters.sensitive, handler);

// Strict endpoints (5 req/min)
router.post('/otp/request', rateLimiters.strict, handler);

// Generous endpoints (500 req/min)
router.get('/products', rateLimiters.generous, handler);
```

### Custom Rate Limit

```typescript
router.post(
  '/upload',
  rateLimit({
    windowMs: 60000, // 1 minute
    maxRequests: 20, // 20 requests
    keyPrefix: 'rl:upload',
  }),
  handler,
);
```

## Response Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1234567890
Retry-After: 45  # (when 429 returned)
```

## 429 Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later."
  }
}
```

## CORS Testing

```bash
# Test allowed origin
curl -H "Origin: https://nearbybazaar.com" http://localhost:3000/test

# Test blocked origin (should fail)
curl -H "Origin: https://evil.com" http://localhost:3000/test
```

## Rate Limit Testing

```bash
# Burst test (send 101 requests rapidly)
for i in {1..101}; do
  curl http://localhost:3000/test;
done

# Should see 429 after 100 requests
```

## Common Issues

### CORS Not Working

- ✅ Check `CORS_ALLOW_ORIGINS` env var
- ✅ Include protocol (https://) and exact domain
- ✅ Restart server after env changes

### Rate Limit Not Enforcing

- ✅ Verify Redis is running: `redis-cli ping`
- ✅ Check `REDIS_URL` env var
- ✅ Ensure JWT middleware runs before rate limiter
- ✅ Review logs for Redis errors

### Legitimate Users Rate Limited

- ✅ Increase limit for authenticated users
- ✅ Use `rateLimiters.generous` for public reads
- ✅ Apply custom limits to specific routes

## Monitoring

```typescript
import { getRateLimitStatus } from './middleware/rateLimit';

const status = await getRateLimitStatus(req, config);
// {
//   current: 45,
//   limit: 100,
//   remaining: 55,
//   resetAt: Date
// }
```

## Testing

```bash
# Run CORS tests
pnpm test cors.spec.ts

# Run rate limit tests
pnpm test rateLimit.spec.ts

# Run all security tests
pnpm test
```

## Fail-Open Behavior

If Redis is unavailable:

- ✅ Requests are allowed (no 429 errors)
- ⚠️ Monitor logs for Redis connection issues
- 🔴 Fix Redis ASAP in production

## Files

- `apps/api/src/middleware/cors.ts` - CORS configuration
- `apps/api/src/middleware/rateLimit.ts` - Rate limiting logic
- `apps/api/tests/cors.spec.ts` - CORS tests (10 tests)
- `apps/api/tests/rateLimit.spec.ts` - Rate limit tests (19 tests)
- `docs/CORS_AND_RATE_LIMITING.md` - Full documentation

---

**Feature #172** | 29 tests passing | Redis required | CORS configurable
