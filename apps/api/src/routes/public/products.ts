import { Router } from 'express';
import { Product } from '../../models/Product';
import crypto from 'crypto';

const router = Router();

router.get('/', async (req, res) => {
    const { page = 1, limit = 20, q, vendor } = req.query;
    const filter: any = { deleted: false };
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (vendor) filter.vendor = vendor;
    const skip = (Number(page) - 1) * Number(limit);
    const products = await Product.find(filter).skip(skip).limit(Number(limit)).lean();
    const total = await Product.countDocuments(filter);
    // ETag for cache
    const etag = crypto.createHash('md5').update(JSON.stringify(products)).digest('hex');
    res.set('Cache-Control', 'public, max-age=60');
    res.set('ETag', etag);
    res.json({
        items: products,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});

export default router;
