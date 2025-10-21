import { Router } from 'express';
import suppliersRouter from './suppliers';
import mappingsRouter from './mappings';
import marginRulesRouter from './margin-rules';
import syncRouter from './sync';

const router = Router();

/**
 * Dropshipping Module API Endpoints
 * 
 * All endpoints require authentication and apply RBAC:
 * - Vendors: Can only access their own resources
 * - Admins: Can access all resources
 * - Suppliers: Can access assigned resources (future)
 * 
 * Base path: /api/dropship
 */

// Supplier management
router.use('/suppliers', suppliersRouter);

// SKU mapping management
router.use('/mappings', mappingsRouter);

// Margin rules management
router.use('/margin-rules', marginRulesRouter);

// Sync management
router.use('/sync', syncRouter);

/**
 * GET /api/dropship
 * Get dropship module overview/stats.
 */
router.get('/', async (req, res) => {
    try {
        // @ts-ignore
        const { userId, userType } = req.user;

        // RBAC: Only vendors and admins
        if (userType !== 'vendor' && userType !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        // TODO: Aggregate stats from various models
        const stats = {
            suppliers: {
                total: 0,
                active: 0,
                pending: 0,
            },
            mappings: {
                total: 0,
                active: 0,
            },
            marginRules: {
                total: 0,
                active: 0,
            },
            recentSyncs: [],
        };

        res.json({ stats });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
