import { Router } from 'express';
import { Classified } from '../../models/Classified';
import crypto from 'crypto';

const router = Router();

router.get('/', async (req, res) => {
    const { page = 1, limit = 20, q, vendor } = req.query;
    const filter: any = { deleted: false, status: 'active' };
    if (q) filter.title = { $regex: q, $options: 'i' };
    if (vendor) filter.vendor = vendor;
    const skip = (Number(page) - 1) * Number(limit);
    const classifieds = await Classified.find(filter).skip(skip).limit(Number(limit)).lean();
    const total = await Classified.countDocuments(filter);
    const etag = crypto.createHash('md5').update(JSON.stringify(classifieds)).digest('hex');
    res.set('Cache-Control', 'public, max-age=60');
    res.set('ETag', etag);
    res.json({
        items: classifieds,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});

export default router;
