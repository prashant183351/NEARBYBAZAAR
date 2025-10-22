import { Router } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import MarginRuleModel from '../../models/MarginRule';

const router = Router();

// Zod schemas for validation
const marginRuleBaseSchema = z.object({
  supplierId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID')
    .optional(),
  category: z.string().optional(),
  marginType: z.enum(['percent', 'fixed']),
  value: z.number().min(0, 'Margin value must be positive'),
});

const createMarginRuleSchema = marginRuleBaseSchema.refine(
  (data) => data.supplierId || data.category,
  { message: 'Either supplierId or category must be provided' },
);

const updateMarginRuleSchema = marginRuleBaseSchema.partial();

/**
 * POST /api/dropship/margin-rules
 * Create a new margin rule.
 */
router.post('/', async (req, res) => {
  try {
  // @ts-expect-error: req.user is injected by auth middleware and not typed in Express.Request
    const { userId, userType } = req.user;

    // Validate request body
    const validatedData = createMarginRuleSchema.parse(req.body);

    // RBAC: Only vendors and admins can create margin rules
    if (userType !== 'vendor' && userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    const vendorId =
      userType === 'vendor' ? new Types.ObjectId(userId) : new Types.ObjectId(req.body.vendorId);

    // Check for existing rule with same criteria
  const filter: Record<string, unknown> = { vendorId, active: true };
    if (validatedData.supplierId) filter.supplierId = new Types.ObjectId(validatedData.supplierId);
    if (validatedData.category) filter.category = validatedData.category;

    const existing = await MarginRuleModel.findOne(filter);
    if (existing) {
      return res.status(409).json({
        error: 'Margin rule already exists for this criteria',
        existing,
      });
    }

    const rule = await MarginRuleModel.create({
      vendorId,
      supplierId: validatedData.supplierId
        ? new Types.ObjectId(validatedData.supplierId)
        : undefined,
      category: validatedData.category,
      marginType: validatedData.marginType,
      value: validatedData.value,
      active: true,
    });

    res.status(201).json({ rule });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: (error as z.ZodError).errors });
    }
    const message = (error instanceof Error) ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/dropship/margin-rules
 * List margin rules with filtering.
 */
router.get('/', async (req, res) => {
  try {
  // @ts-expect-error: req.user is injected by auth middleware and not typed in Express.Request
    const { userId, userType } = req.user;
    const { supplierId, category, active = 'true' } = req.query;

  const filter: Record<string, unknown> = {};

    // RBAC: Vendors can only see their own rules
    if (userType === 'vendor') {
      filter.vendorId = new Types.ObjectId(userId);
    } else if (userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    if (supplierId) {
      filter.supplierId = new Types.ObjectId(supplierId as string);
    }

    if (category) {
      filter.category = category;
    }

    if (active !== 'all') {
      filter.active = active === 'true';
    }

    const rules = await MarginRuleModel.find(filter)
      .populate('supplierId', 'companyName')
      .sort({ createdAt: -1 });

    res.json({ rules });
  } catch (error: unknown) {
    const message = (error instanceof Error) ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/dropship/margin-rules/:id
 * Get margin rule details by ID.
 */
router.get('/:id', async (req, res) => {
  try {
  // @ts-expect-error: req.user is injected by auth middleware and not typed in Express.Request
    const { userId, userType } = req.user;

    const rule = await MarginRuleModel.findById(req.params.id).populate('supplierId');

    if (!rule) {
      return res.status(404).json({ error: 'Margin rule not found' });
    }

    // RBAC: Vendors can only access their own rules
    if (userType === 'vendor' && rule.vendorId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    res.json({ rule });
  } catch (error: unknown) {
    const message = (error instanceof Error) ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * PUT /api/dropship/margin-rules/:id
 * Update a margin rule.
 */
router.put('/:id', async (req, res) => {
  try {
  // @ts-expect-error: req.user is injected by auth middleware and not typed in Express.Request
    const { userId, userType } = req.user;

    // Validate request body
    const validatedData = updateMarginRuleSchema.parse(req.body);

    const rule = await MarginRuleModel.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({ error: 'Margin rule not found' });
    }

    // RBAC: Vendors can only update their own rules
    if (userType === 'vendor' && rule.vendorId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    Object.assign(rule, validatedData);
    await rule.save();

    res.json({ rule });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: (error as z.ZodError).errors });
    }
    const message = (error instanceof Error) ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * DELETE /api/dropship/margin-rules/:id
 * Deactivate a margin rule.
 */
router.delete('/:id', async (req, res) => {
  try {
  // @ts-expect-error: req.user is injected by auth middleware and not typed in Express.Request
    const { userId, userType } = req.user;

    const rule = await MarginRuleModel.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({ error: 'Margin rule not found' });
    }

    // RBAC: Vendors can only delete their own rules
    if (userType === 'vendor' && rule.vendorId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    rule.active = false;
    await rule.save();

    res.json({ message: 'Margin rule deactivated successfully' });
  } catch (error: unknown) {
    const message = (error instanceof Error) ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/dropship/margin-rules/calculate
 * Calculate price with margin applied.
 */
router.post('/calculate', async (req, res) => {
  try {
  // @ts-expect-error: req.user is injected by auth middleware and not typed in Express.Request
    const { userId, userType } = req.user;

    const { cost, supplierId, category } = req.body;

    if (!cost || cost <= 0) {
      return res.status(400).json({ error: 'Valid cost is required' });
    }

  const filter: Record<string, unknown> = { active: true };

    // RBAC: Vendors calculate for their own rules
    if (userType === 'vendor') {
      filter.vendorId = new Types.ObjectId(userId);
    } else if (userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    // Find applicable margin rule (most specific first)
    if (supplierId) {
      filter.supplierId = new Types.ObjectId(supplierId);
      const rule = await MarginRuleModel.findOne(filter);
      if (rule) {
        const price = calculatePrice(cost, rule.marginType, rule.value);
        return res.json({ cost, price, marginType: rule.marginType, marginValue: rule.value });
      }
    }

    if (category) {
      delete filter.supplierId;
      filter.category = category;
      const rule = await MarginRuleModel.findOne(filter);
      if (rule) {
        const price = calculatePrice(cost, rule.marginType, rule.value);
        return res.json({ cost, price, marginType: rule.marginType, marginValue: rule.value });
      }
    }

    // No rule found, return cost as-is
    res.json({ cost, price: cost, message: 'No margin rule applied' });
  } catch (error: unknown) {
    const message = (error instanceof Error) ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * Helper function to calculate price with margin.
 */
function calculatePrice(cost: number, marginType: 'percent' | 'fixed', value: number): number {
  if (marginType === 'percent') {
    return cost * (1 + value / 100);
  } else {
    return cost + value;
  }
}

export default router;
