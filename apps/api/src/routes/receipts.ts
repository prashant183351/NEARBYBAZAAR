import { Router } from 'express';
import { getReceipt, listReceipts } from '../controllers/receipts';

const router = Router();

router.get('/v1/receipts/:id', getReceipt);
router.get('/v1/receipts', listReceipts);

export default router;
