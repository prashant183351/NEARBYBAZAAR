import { Router } from 'express';
import * as services from '../controllers/services';

const router = Router();

router.get('/', services.listServices);
// temporary: support fetching by id or slug via separate routes
router.get('/slug/:slug', services.getServiceBySlug);
router.get('/:id', services.getService);
router.post('/', services.createService);
router.put('/:id', services.updateService);
router.delete('/:id', services.deleteService);

export default router;
