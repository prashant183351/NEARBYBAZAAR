import { ApiKey } from '../models/ApiKey';
import crypto from 'crypto';
import { Request, Response } from 'express';

export async function createApiKey(req: Request, res: Response) {
	const { appId, owner, scopes, expiresAt } = req.body;
	const key = crypto.randomBytes(32).toString('hex');
	await ApiKey.create({ key, appId, owner, scopes, expiresAt });
	res.json({ key });
}

export async function rotateApiKey(req: Request, res: Response) {
	const { key } = req.body;
	const apiKey = await ApiKey.findOne({ key });
	if (!apiKey) return res.status(404).json({ error: 'API key not found' });
	apiKey.key = crypto.randomBytes(32).toString('hex');
	apiKey.rotatedAt = new Date();
	await apiKey.save();
	res.json({ newKey: apiKey.key });
}

export async function deactivateApiKey(req: Request, res: Response) {
	const { key } = req.body;
	await ApiKey.updateOne({ key }, { active: false });
	res.json({ success: true });
}
