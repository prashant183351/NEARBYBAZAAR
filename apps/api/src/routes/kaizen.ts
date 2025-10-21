import { Router } from 'express';
import * as kaizen from '../controllers/kaizen';

const router = Router();
import { rateLimit } from '../middleware/rateLimit';
import { sendMail } from '../services/mailer';

router.get('/', kaizen.listKaizen);
router.get('/:id', kaizen.getKaizen);
router.post('/', kaizen.createKaizen);
router.put('/:id', kaizen.updateKaizen);
router.delete('/:id', kaizen.deleteKaizen);

export default router;
// Public Kaizen idea submission
router.post('/submit', rateLimit({ windowMs: 60000, maxRequests: 3 }), async (req, res) => {
    const { title, desc } = req.body;
    // Save idea (stub)
    // TODO: persist to DB
    // Send notification/email
    await sendMail({
        to: 'kaizen@nearbybazaar.com',
        subject: `New Kaizen Idea: ${title}`,
        text: desc,
    });
    res.json({ ok: true });
});
