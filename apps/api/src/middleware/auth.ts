import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuthToken } from '../models/OAuthToken';
import { jwtMiddleware, UserClaims } from '../auth/jwt';
import { AbilityContext, Action, Resource, can } from '../rbac/ability';

// Extend Express Request type to include user with optional scopes
declare global {
  namespace Express {
	interface Request {
	  user?: UserClaims & { scopes?: string[] };
	}
  }
}

export { jwtMiddleware };

export type AuthorizeOptions = {
	action: Action;
	resource: Resource;
	// Derive ownership context from the request, e.g., get vendorId from body or resolve resourceOwnerId via loader
	getContext?: (req: Request) => Promise<AbilityContext> | AbilityContext;
	// If true, require authentication; otherwise allow unauthenticated but still run can() (useful for read routes if needed)
	requireAuth?: boolean;
};

export function authorize(opts: AuthorizeOptions) {
	const { action, resource, getContext, requireAuth = true } = opts;
	return async (req: Request, res: Response, next: NextFunction) => {
		const user: UserClaims | undefined = (req as any).user;
		if (requireAuth && !user) {
			return res.status(401).json({ error: 'Unauthorized' });
		}
		const ctx = (await (getContext ? getContext(req) : {})) as AbilityContext;
		const allowed = user ? can(user, action, resource, ctx) : action === 'read';
		if (!allowed) return res.status(403).json({ error: 'Forbidden' });
		return next();
	};
}

export async function validateToken(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.headers['authorization'];
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Authorization header missing or invalid' });
	}

	const token = authHeader.split(' ')[1];

	try {
		// Check if the token is a JWT
		const decoded = jwt.decode(token, { complete: true });
		if (decoded && typeof decoded === 'object' && decoded.header && decoded.payload) {
			// Verify JWT signature and expiry
			jwt.verify(token, process.env.JWT_SECRET!);
			if (typeof decoded.payload === 'object' && decoded.payload !== null) {
				req.user = decoded.payload as UserClaims; // Attach user info to request
				return next();
			} else {
				return res.status(401).json({ error: 'Invalid JWT payload' });
			}
		}

		// If not a JWT, check if it's an OAuth access token
		const oauthToken = await OAuthToken.findOne({ accessToken: token });
		if (!oauthToken) {
			return res.status(401).json({ error: 'Invalid token' });
		}

		if (new Date() > oauthToken.expires_at) {
			return res.status(401).json({ error: 'Token expired' });
		}

		req.user = {
			id: ((oauthToken as any).user || oauthToken._id)?.toString?.() ?? '',
			email: (oauthToken as any).email ?? '',
			role: (oauthToken as any).role ?? 'user',
			scopes: oauthToken.scopes,
			vendorId: (oauthToken as any).vendorId,
		} as UserClaims & { scopes: string[] }; // Attach user info and scopes
		next();
	} catch (err) {
		return res.status(401).json({ error: 'Token validation failed' });
	}
}

export function requireScopes(requiredScopes: string[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		const userScopes: string[] = req.user?.scopes || [];
		const hasAllScopes = requiredScopes.every(scope => userScopes.includes(scope));

		if (!hasAllScopes) {
			return res.status(403).json({ error: 'Insufficient permissions' });
		}

		next();
	};
}
