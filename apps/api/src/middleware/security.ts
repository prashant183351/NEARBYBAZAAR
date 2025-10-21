import { sendToSiem } from '../services/siem';

// Example: log failed login attempts to SIEM
import { Request } from 'express';

export function logFailedLogin(req: Request, userEmail: string) {
	sendToSiem({ event: 'failed_login', email: userEmail, ip: req.ip, time: new Date() });
}