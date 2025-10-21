import { Router } from 'express';
import * as classifieds from '../controllers/classifieds';

const router = Router();

router.get('/', classifieds.listClassifieds);
router.get('/slug/:slug', classifieds.getClassifiedBySlug);
router.get('/:id', classifieds.getClassified);
router.post('/', classifieds.createClassified);
router.put('/:id', classifieds.updateClassified);
router.delete('/:id', classifieds.deleteClassified);

export default router;
