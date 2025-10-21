import { Router } from 'express';
import { authorize } from '../middleware/auth';
import { createWarrantyClaim, listMyWarrantyClaims } from '../controllers/warrantyClaims';

const router = Router();

router.post(
    '/',
    authorize({
        action: 'create',
        resource: 'warrantyClaim',
        requireAuth: true,
        getContext: (req) => ({ ownerId: (req as any).user?.id ?? null }),
    }),
    createWarrantyClaim
);

router.get(
    '/mine',
    authorize({
        action: 'read',
        resource: 'warrantyClaim',
        requireAuth: true,
        getContext: (req) => ({ resourceOwnerId: (req as any).user?.id ?? null }),
    }),
    listMyWarrantyClaims
);

export default router;
