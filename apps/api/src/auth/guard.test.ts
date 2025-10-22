import { Request, Response, NextFunction } from 'express';
import { signJwt, jwtMiddleware, UserClaims } from './jwt';
import { requireAuth } from './guard';
import { can } from '../rbac/ability';

describe('JWT Auth Middleware', () => {
  it('should attach user to req if JWT is valid', () => {
    const user: UserClaims = { id: '123', email: 'test@example.com', role: 'user' };
    const token = signJwt(user);
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res: any = {};
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };
    jwtMiddleware(req, res, next);
    expect(req.user).toMatchObject(user);
    expect(called).toBe(true);
  });

  it('should not attach user if JWT is missing', () => {
    const req: any = { headers: {} };
    const res: any = {};
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };
    jwtMiddleware(req, res, next);
    expect(req.user).toBeUndefined();
    expect(called).toBe(true);
  });
});

describe('RBAC Guard', () => {
  it('should allow access if user can perform action', () => {
    const user: UserClaims = { id: '123', email: 'admin@example.com', role: 'admin' };
    const req: any = { user };
    const res: any = {};
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };
    const middleware = requireAuth('manage', 'store');
    middleware(req, res, next);
    expect(called).toBe(true);
  });

  it('should deny access if user cannot perform action', () => {
    const user: UserClaims = { id: '123', email: 'user@example.com', role: 'user' };
    let statusCode = 0;
    const req: any = { user };
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: () => {},
    };
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };
    const middleware = requireAuth('manage', 'store');
    middleware(req, res, next);
    expect(statusCode).toBe(403);
    expect(called).toBe(false);
  });
});
