import { Router } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { SkuMapping as SkuMappingModel } from '../../models/SkuMapping';

const router = Router();

// Zod schemas for validation
const createSkuMappingSchema = z.object({
    supplierId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID'),
    supplierSku: z.string().min(1, 'Supplier SKU is required'),
    ourSku: z.string().min(1, 'Our SKU is required'),
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
    mapping: z.object({
        productId: z.string(),
        variantId: z.string().optional(),
        priceMultiplier: z.number().min(1).optional(),
    }).optional(),
    notes: z.string().optional(),
});

const updateSkuMappingSchema = createSkuMappingSchema.partial().omit({ supplierId: true, supplierSku: true });

const bulkMappingSchema = z.object({
    supplierId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID'),
    mappings: z.array(z.object({
        supplierSku: z.string(),
        ourSku: z.string(),
        productId: z.string(),
    })),
});

/**
 * POST /api/dropship/mappings
 * Create a new SKU mapping.
 */
router.post('/', async (req, res) => {
    try {
        // @ts-ignore
        const { userId, userType } = req.user;

        // Validate request body
        const validatedData = createSkuMappingSchema.parse(req.body);

        // RBAC: Only vendors and admins can create mappings
        if (userType !== 'vendor' && userType !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        // Vendors create mappings for themselves
        const vendorId = userType === 'vendor'
            ? new Types.ObjectId(userId)
            : new Types.ObjectId(req.body.vendorId);

        // Check if mapping already exists
        const existing = await SkuMappingModel.findOne({
            vendorId,
            supplierId: new Types.ObjectId(validatedData.supplierId),
            supplierSku: validatedData.supplierSku,
        });

        if (existing) {
            return res.status(409).json({
                error: 'Mapping already exists',
                existing,
                message: 'Use PUT to update existing mapping',
            });
        }

        const mapping = await SkuMappingModel.create({
            vendorId,
            supplierId: new Types.ObjectId(validatedData.supplierId),
            supplierSku: validatedData.supplierSku,
            ourSku: validatedData.ourSku,
            productId: new Types.ObjectId(validatedData.productId),
            mapping: validatedData.mapping,
            notes: validatedData.notes,
            status: 'active',
        });

        res.status(201).json({ mapping });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/dropship/mappings/bulk
 * Create multiple SKU mappings at once.
 */
router.post('/bulk', async (req, res) => {
    try {
        // @ts-ignore
        const { userId, userType } = req.user;

        // Validate request body
        const validatedData = bulkMappingSchema.parse(req.body);

        // RBAC: Only vendors and admins can create mappings
        if (userType !== 'vendor' && userType !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        const vendorId = userType === 'vendor'
            ? new Types.ObjectId(userId)
            : new Types.ObjectId(req.body.vendorId);

        const results = {
            created: [] as any[],
            skipped: [] as any[],
            errors: [] as any[],
        };

        for (const item of validatedData.mappings) {
            try {
                // Check if mapping already exists
                const existing = await SkuMappingModel.findOne({
                    vendorId,
                    supplierId: new Types.ObjectId(validatedData.supplierId),
                    supplierSku: item.supplierSku,
                });

                if (existing) {
                    results.skipped.push({ supplierSku: item.supplierSku, reason: 'Already exists' });
                    continue;
                }

                const mapping = await SkuMappingModel.create({
                    vendorId,
                    supplierId: new Types.ObjectId(validatedData.supplierId),
                    supplierSku: item.supplierSku,
                    ourSku: item.ourSku,
                    productId: new Types.ObjectId(item.productId),
                    status: 'active',
                });

                results.created.push(mapping);
            } catch (error: any) {
                results.errors.push({ supplierSku: item.supplierSku, error: error.message });
            }
        }

        res.status(201).json(results);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/dropship/mappings
 * List SKU mappings with filtering and pagination.
 */
router.get('/', async (req, res) => {
    try {
        // @ts-ignore
        const { userId, userType } = req.user;
        const { page = 1, limit = 20, supplierId, status, search } = req.query;

        const filter: any = {};

        // RBAC: Vendors can only see their own mappings
        if (userType === 'vendor') {
            filter.vendorId = new Types.ObjectId(userId);
        } else if (userType !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        // Filter by supplier
        if (supplierId) {
            filter.supplierId = new Types.ObjectId(supplierId as string);
        }

        // Filter by status
        if (status) {
            filter.status = status;
        }

        // Search by SKU
        if (search) {
            filter.$or = [
                { supplierSku: { $regex: search, $options: 'i' } },
                { ourSku: { $regex: search, $options: 'i' } },
            ];
        }

        const mappings = await SkuMappingModel.find(filter)
            .populate('supplierId', 'companyName')
            .populate('productId', 'name sku')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await SkuMappingModel.countDocuments(filter);

        res.json({
            mappings,
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/dropship/mappings/:id
 * Get mapping details by ID.
 */
router.get('/:id', async (req, res) => {
    try {
        // @ts-ignore
        const { userId, userType } = req.user;

        const mapping = await SkuMappingModel.findById(req.params.id)
            .populate('supplierId')
            .populate('productId');

        if (!mapping) {
            return res.status(404).json({ error: 'Mapping not found' });
        }

        // RBAC: Vendors can only access their own mappings
        if (userType === 'vendor' && mapping.vendorId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden: Access denied' });
        }

        res.json({ mapping });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/dropship/mappings/:id
 * Update an existing SKU mapping.
 */
router.put('/:id', async (req, res) => {
    try {
        // @ts-ignore
        const { userId, userType } = req.user;

        // Validate request body
        const validatedData = updateSkuMappingSchema.parse(req.body);

        const mapping = await SkuMappingModel.findById(req.params.id);

        if (!mapping) {
            return res.status(404).json({ error: 'Mapping not found' });
        }

        // RBAC: Vendors can only update their own mappings
        if (userType === 'vendor' && mapping.vendorId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden: Access denied' });
        }

        Object.assign(mapping, validatedData);
        mapping.updatedAt = new Date();
        await mapping.save();

        res.json({ mapping });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/dropship/mappings/:id
 * Delete a SKU mapping (soft delete by setting status to 'inactive').
 */
router.delete('/:id', async (req, res) => {
    try {
        // @ts-ignore
        const { userId, userType } = req.user;

        const mapping = await SkuMappingModel.findById(req.params.id);

        if (!mapping) {
            return res.status(404).json({ error: 'Mapping not found' });
        }

        // RBAC: Vendors can only delete their own mappings
        if (userType === 'vendor' && mapping.vendorId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden: Access denied' });
        }

        mapping.status = 'inactive';
        mapping.updatedAt = new Date();
        await mapping.save();

        res.json({ message: 'Mapping deactivated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/dropship/mappings/resolve/:supplierSku
 * Resolve a supplier SKU to our internal SKU.
 */
router.get('/resolve/:supplierSku', async (req, res) => {
    try {
        // @ts-ignore
        const { userId, userType } = req.user;
        const { supplierId } = req.query;

        if (!supplierId) {
            return res.status(400).json({ error: 'supplierId query parameter is required' });
        }

        const filter: any = {
            supplierId: new Types.ObjectId(supplierId as string),
            supplierSku: req.params.supplierSku,
            status: 'active',
        };

        // RBAC: Vendors can only resolve their own mappings
        if (userType === 'vendor') {
            filter.vendorId = new Types.ObjectId(userId);
        }

        const mapping = await SkuMappingModel.findOne(filter)
            .populate('productId');

        if (!mapping) {
            return res.status(404).json({ error: 'Mapping not found' });
        }

        res.json({ mapping });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
