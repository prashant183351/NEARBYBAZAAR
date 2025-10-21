import { Router } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Supplier as SupplierModel } from '../../models/Supplier';

const router = Router();

// Zod schemas for validation
const createSupplierSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    contactPerson: z.string().min(1, 'Contact person is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        country: z.string(),
        zipCode: z.string(),
    }).optional(),
    apiEndpoint: z.string().url('Valid API endpoint URL required').optional(),
    apiKey: z.string().optional(),
    webhookSecret: z.string().optional(),
    syncSchedule: z.string().optional(),
    bankDetails: z.object({
        accountName: z.string(),
        accountNumber: z.string(),
        bankName: z.string(),
        ifscCode: z.string(),
        branch: z.string().optional(),
    }).optional(),
    taxInfo: z.object({
        gstNumber: z.string(),
        panNumber: z.string(),
    }).optional(),
});

const updateSupplierSchema = createSupplierSchema.partial();

/**
 * POST /api/dropship/suppliers
 * Create a new supplier (Admin or Vendor).
 */
router.post('/', async (req, res) => {
    try {
        // @ts-ignore - auth middleware sets req.user
        const { userId, userType } = req.user;

        // Validate request body
        const validatedData = createSupplierSchema.parse(req.body);

        // RBAC: Only vendors and admins can create suppliers
        if (userType !== 'vendor' && userType !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        // Vendors can only create suppliers for themselves
        const vendorId = userType === 'vendor'
            ? new Types.ObjectId(userId)
            : new Types.ObjectId(req.body.vendorId);

        const supplier = await SupplierModel.create({
            ...validatedData,
            vendorId,
            status: 'pending',
            onboardedAt: new Date(),
        });

        res.status(201).json({ supplier });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/dropship/suppliers
 * List suppliers with filtering and pagination.
 */
router.get('/', async (req, res) => {
    try {
        // @ts-ignore
        const { userId, userType } = req.user;
        const { page = 1, limit = 20, status, search } = req.query;

        const filter: any = {};

        // RBAC: Vendors can only see their own suppliers
        if (userType === 'vendor') {
            filter.vendorId = new Types.ObjectId(userId);
        } else if (userType !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        // Filter by status
        if (status) {
            filter.status = status;
        }

        // Search by company name or contact person
        if (search) {
            filter.$or = [
                { companyName: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const suppliers = await SupplierModel.find(filter)
            .sort({ onboardedAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .select('-apiKey -webhookSecret'); // Don't expose secrets

        const total = await SupplierModel.countDocuments(filter);

        res.json({
            suppliers,
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
 * GET /api/dropship/suppliers/:id
 * Get supplier details by ID.
 */
router.get('/:id', async (req, res) => {
    try {
        // @ts-ignore
        const { userId, userType } = req.user;

        const supplier = await SupplierModel.findById(req.params.id)
            .select('-apiKey -webhookSecret'); // Don't expose secrets in GET

        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        // RBAC: Vendors can only access their own suppliers
        if (userType === 'vendor' && supplier.vendorId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden: Access denied' });
        }

        res.json({ supplier });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/dropship/suppliers/:id
 * Update supplier details.
 */
router.put('/:id', async (req, res) => {
    try {
        // @ts-ignore
        const { userId, userType } = req.user;

        // Validate request body
        const validatedData = updateSupplierSchema.parse(req.body);

        const supplier = await SupplierModel.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        // RBAC: Vendors can only update their own suppliers
        if (userType === 'vendor' && supplier.vendorId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden: Access denied' });
        }

        Object.assign(supplier, validatedData);
        await supplier.save();

        res.json({ supplier });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/dropship/suppliers/:id/status
 * Update supplier status (Admin only for approval/rejection).
 */
router.put('/:id/status', async (req, res) => {
    try {
        // @ts-ignore
        const { userType } = req.user;

        // RBAC: Only admins can change status to active/suspended
        const { status } = req.body;
        if ((status === 'active' || status === 'suspended') && userType !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const supplier = await SupplierModel.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json({ supplier });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/dropship/suppliers/:id
 * Delete a supplier (soft delete by setting status to 'inactive').
 */
router.delete('/:id', async (req, res) => {
    try {
        // @ts-ignore
        const { userId, userType } = req.user;

        const supplier = await SupplierModel.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        // RBAC: Vendors can only delete their own suppliers
        if (userType === 'vendor' && supplier.vendorId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden: Access denied' });
        }

    supplier.status = 'terminated';
        await supplier.save();

        res.json({ message: 'Supplier deactivated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/dropship/suppliers/:id/stats
 * Get supplier statistics (orders, products, performance).
 */
router.get('/:id/stats', async (req, res) => {
    try {
        // @ts-ignore
        const { userId, userType } = req.user;

        const supplier = await SupplierModel.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        // RBAC: Vendors can only access their own supplier stats
        if (userType === 'vendor' && supplier.vendorId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden: Access denied' });
        }

        // TODO: Aggregate statistics from orders, products, etc.
        const stats = {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            productCount: 0,
            activeProducts: 0,
            lastSyncAt: supplier.lastSyncAt,
            // TODO: Add more metrics
        };

        res.json({ stats });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
