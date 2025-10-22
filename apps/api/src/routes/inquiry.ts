import { Router } from 'express';
import { emailQueue } from '../queues';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { sanitize } from '../middleware/sanitize';
import { verifyRecaptcha } from '../middleware/recaptcha';

const router = Router();

const inquirySchema = z.object({
  name: z.string().min(1, 'name is required'),
  message: z.string().min(1, 'message is required'),
  slug: z.string().min(1, 'slug is required'),
  email: z.string().email().optional(),
});

router.post(
  '/',
  verifyRecaptcha,
  sanitize({ body: { message: 'plain', name: 'plain', slug: 'plain', email: 'plain' } }),
  validate(inquirySchema),
  async (req, res) => {
    const { name, message, slug, email } = req.body;
    await emailQueue.add('send', {
      to: process.env.ADMIN_EMAIL,
      subject: `Inquiry for ${slug}`,
      text: `Name: ${name}${email ? `\nEmail: ${email}` : ''}\nMessage: ${message}`,
    });
    res.json({ success: true });
  },
);

export default router;
