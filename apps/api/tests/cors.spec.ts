import request from 'supertest';
import express from 'express';
import { corsMiddleware, isOriginAllowed } from '../src/middleware/cors';

describe('CORS Middleware', () => {
  let app: express.Application;
  const originalEnv = process.env.CORS_ALLOW_ORIGINS;

  // Helper to create app with current environment
  const createApp = () => {
    const newApp = express();
    newApp.use(corsMiddleware);
    newApp.get('/test', (_req, res) => res.json({ ok: true }));
    return newApp;
  };

  beforeEach(() => {
    delete process.env.CORS_ALLOW_ORIGINS;
    app = createApp();
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.CORS_ALLOW_ORIGINS = originalEnv;
    } else {
      delete process.env.CORS_ALLOW_ORIGINS;
    }
  });

  it('should allow requests with no origin', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
  });

  it('should allow whitelisted origins', async () => {
    process.env.CORS_ALLOW_ORIGINS = 'https://nearbybazaar.com,https://vendor.nearbybazaar.com';
    app = createApp(); // Recreate app with new env

    const res = await request(app).get('/test').set('Origin', 'https://nearbybazaar.com');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://nearbybazaar.com');
  });

  it('should block non-whitelisted origins', async () => {
    process.env.CORS_ALLOW_ORIGINS = 'https://nearbybazaar.com';
    app = createApp(); // Recreate app with new env

    const res = await request(app).get('/test').set('Origin', 'https://evil.com');

    expect(res.status).toBe(500); // CORS error
  });

  it('should allow all origins with wildcard', async () => {
    process.env.CORS_ALLOW_ORIGINS = '*';
    app = createApp(); // Recreate app with new env

    const res = await request(app).get('/test').set('Origin', 'https://localhost:3000');

    expect(res.status).toBe(200);
  });

  it('should expose rate limit headers', async () => {
    process.env.CORS_ALLOW_ORIGINS = 'https://nearbybazaar.com';

    const res = await request(app).get('/test').set('Origin', 'https://nearbybazaar.com');

    expect(res.headers['access-control-expose-headers']).toContain('X-RateLimit-Limit');
    expect(res.headers['access-control-expose-headers']).toContain('X-RateLimit-Remaining');
    expect(res.headers['access-control-expose-headers']).toContain('Retry-After');
  });

  it('should allow credentials', async () => {
    process.env.CORS_ALLOW_ORIGINS = 'https://nearbybazaar.com';

    const res = await request(app).get('/test').set('Origin', 'https://nearbybazaar.com');

    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  describe('isOriginAllowed helper', () => {
    it('should return true for no origin', () => {
      expect(isOriginAllowed(undefined)).toBe(true);
    });

    it('should return true for wildcard', () => {
      process.env.CORS_ALLOW_ORIGINS = '*';
      expect(isOriginAllowed('https://any.com')).toBe(true);
    });

    it('should return true for whitelisted origin', () => {
      process.env.CORS_ALLOW_ORIGINS = 'https://nearbybazaar.com';
      expect(isOriginAllowed('https://nearbybazaar.com')).toBe(true);
    });

    it('should return false for non-whitelisted origin', () => {
      process.env.CORS_ALLOW_ORIGINS = 'https://nearbybazaar.com';
      expect(isOriginAllowed('https://evil.com')).toBe(false);
    });
  });
});
