import { Router, Request, Response } from 'express';
import { Form } from '../models/Form';
import { requireAuth } from '../auth/guard';

const router = Router();

/**
 * @openapi
 * /api/forms:
 *   get:
 *     summary: List all forms
 *     responses:
 *       200:
 *         description: List of forms
 */
router.get('/', requireAuth('read', 'admin'), async (_req: Request, res: Response) => {
    const forms = await Form.find({ deleted: false });
    res.json({ forms });
});

/**
 * @openapi
 * /api/forms:
 *   post:
 *     summary: Create a new form
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Form'
 *     responses:
 *       201:
 *         description: Form created
 */
router.post('/', requireAuth('create', 'admin'), async (req: Request, res: Response) => {
    const form = await Form.create(req.body);
    res.status(201).json({ form });
});

/**
 * @openapi
 * /api/forms/{id}:
 *   put:
 *     summary: Update a form
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Form'
 *     responses:
 *       200:
 *         description: Form updated
 */
router.put('/:id', requireAuth('update', 'admin'), async (req, res) => {
    const form = await Form.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!form) return res.status(404).json({ error: 'Not found' });
    res.json({ form });
});

/**
 * @openapi
 * /api/forms/{id}:
 *   delete:
 *     summary: Delete a form
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form deleted
 */
router.delete('/:id', requireAuth('delete', 'admin'), async (req, res) => {
    const form = await Form.findByIdAndUpdate(req.params.id, { deleted: true }, { new: true });
    if (!form) return res.status(404).json({ error: 'Not found' });
    res.json({ form });
});

export default router;
