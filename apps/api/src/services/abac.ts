import { Request } from 'express';

export interface AbacContext {
	role: string;
	attributes: {
		otpVerified?: boolean;
		ip?: string;
		deviceTrusted?: boolean;
		time?: Date;
		[extra: string]: any;
	};
}

export type AbacPolicy = (ctx: AbacContext) => boolean;

// Example: Only allow if admin, OTP verified, and IP in office range
export const canExportVendorPII: AbacPolicy = (ctx) => {
	if (ctx.role !== 'admin') return false;
	if (!ctx.attributes.otpVerified) return false;
	if (!ctx.attributes.ip?.startsWith('10.0.')) return false; // Example: office IP range
	return true;
};

// Policy engine
export function checkAbac(policy: AbacPolicy, req: Request): boolean {
	const ctx: AbacContext = {
		role: req.user?.role || 'guest',
		attributes: {
			otpVerified: (req as any).session?.otpVerified ?? false,
			ip: req.ip,
			deviceTrusted: (req as any).session?.deviceTrusted ?? false,
			time: new Date(),
			// Add more attributes as needed
		},
	};
	return policy(ctx);
}
