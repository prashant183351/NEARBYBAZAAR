import express from 'express';
import { validate } from '../middleware/validate';
import { OAuthClient } from '../models/OAuthClient';
import { OAuthToken } from '../models/OAuthToken';
import { OAuthSchema } from '../schemas/OAuthSchemas';
import crypto from 'crypto';

const router = express.Router();

// Endpoint to issue tokens
router.post('/token', validate(OAuthSchema.tokenRequest), async (req, res) => {
    const { client_id, client_secret } = req.body;

    const client = await OAuthClient.findOne({ client_id, client_secret });
    if (!client) {
        return res.status(401).json({ error: 'Invalid client credentials' });
    }

    const token = new OAuthToken({
        token: crypto.randomBytes(32).toString('hex'),
        client_id: client.client_id,
        expires_at: new Date(Date.now() + 3600 * 1000), // 1 hour expiry
    });

    await token.save();

    res.json({
        access_token: token.token,
        token_type: 'Bearer',
        expires_in: 3600,
    });
});

// Endpoint to revoke tokens
router.post('/revoke', validate(OAuthSchema.revokeRequest), async (req, res) => {
    const { token } = req.body;

    const deletedToken = await OAuthToken.findOneAndDelete({ token });
    if (!deletedToken) {
        return res.status(400).json({ error: 'Invalid token' });
    }

    res.status(200).json({ message: 'Token revoked successfully' });
});

export default router;