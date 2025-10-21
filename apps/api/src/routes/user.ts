import { Router } from 'express';
import { User } from '../models/User';
import argon2 from 'argon2';
import { sanitize } from '../middleware/sanitize';

const router = Router();

// List users
router.get('/', async (_req, res) => {
    const users = await User.find({ deleted: false });
    res.json({ users });
});

// Get user by id
router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user || user.deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ user });
});

// Create user (stub)
router.post('/', sanitize({ body: { email: 'plain', name: 'plain', role: 'plain', password: 'plain' } }), async (req, res) => {
    const body = req.body;
    if (body.password) {
        body.password = await argon2.hash(body.password);
    }
    const user = await User.create(body);
    res.status(201).json({ user });
});

// Soft delete user
router.delete('/:id', async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { deleted: true }, { new: true });
    res.json({ user });
});

export default router;
