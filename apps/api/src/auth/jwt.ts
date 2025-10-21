import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES_IN = '7d';

export const UserClaimsSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(['user', 'vendor', 'admin']),
});

export type UserClaims = z.infer<typeof UserClaimsSchema>;

export function signJwt(claims: UserClaims) {
    return jwt.sign(claims, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwt(token: string): UserClaims | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const parsed = UserClaimsSchema.safeParse(decoded);
        if (parsed.success) return parsed.data;
        return null;
    } catch {
        return null;
    }
}

export function jwtMiddleware(req: Request, _res: Response, next: NextFunction) {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
        const token = auth.slice(7);
        const user = verifyJwt(token);
        if (user) {
            (req as any).user = user;
        }
    }
    next();
}
