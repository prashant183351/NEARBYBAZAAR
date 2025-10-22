import { Router } from 'express';
import { emailQueue } from '../queues';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { sanitize } from '../middleware/sanitize';
import { verifyRecaptcha } from '../middleware/recaptcha';

const router = Router();

const bookingSchema = z.object({
  name: z.string().min(1, 'name is required'),
  date: z.string().min(1, 'date is required'),
  slug: z.string().min(1, 'slug is required'),
  phone: z.string().optional(),
});

router.post(
  '/',
  verifyRecaptcha,
  sanitize({ body: { name: 'plain', date: 'plain', slug: 'plain', phone: 'plain' } }),
  validate(bookingSchema),
  async (req, res) => {
    const { name, date, slug } = req.body;
    await emailQueue.add('send', {
      to: process.env.ADMIN_EMAIL,
      subject: `Booking for ${slug}`,
      text: `Name: ${name}\nDate: ${date}`,
    });
    res.json({ success: true });
  },
);

export default router;
