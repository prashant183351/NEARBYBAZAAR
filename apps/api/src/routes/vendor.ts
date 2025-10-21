import { Router } from 'express';
import { Vendor } from '../models/Vendor';
import { resolveLatestSlug } from '../services/slugHistory';

const router = Router();

// GET /v1/vendors/slug/:slug - Get vendor by slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const vendor = await Vendor.findOne({ slug, deleted: { $ne: true } }).lean();

        if (!vendor) {
            const latest = await resolveLatestSlug('vendor', slug);
            if (latest) {
                res.set('Location', `/store/${latest}`);
                return res.status(301).end();
            }
            return res.status(404).json({ error: 'Vendor not found' });
        }

        res.json(vendor);
    } catch (error) {
        console.error('Error fetching vendor by slug:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// List vendors with pagination
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const [vendors, total] = await Promise.all([
            Vendor.find({ deleted: { $ne: true } })
                .select('name slug email logoUrl planTier')
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Vendor.countDocuments({ deleted: { $ne: true } }),
        ]);

        res.json({
            items: vendors,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error listing vendors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get vendor by id
router.get('/:id', async (req, res) => {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor || vendor.deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ vendor });
});

// Create vendor (stub)
router.post('/', async (req, res) => {
    const vendor = await Vendor.create(req.body);
    res.status(201).json({ vendor });
});

// Soft delete vendor
router.delete('/:id', async (req, res) => {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { deleted: true }, { new: true });
    res.json({ vendor });
});

export default router;
