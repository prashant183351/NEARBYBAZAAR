import { Router } from 'express';
import { bumpClassified } from '../../controllers/classifieds/bump';

const router = Router();

router.post('/:id/bump', bumpClassified);

export default router;
