import { Router } from 'express';
import { searchProducts, searchServices } from '../services/search';

const router = Router();

router.get('/products', async (req, res) => {
  const q = String(req.query.q || '');
  const limit = Number(req.query.limit || 20);
  const offset = Number(req.query.offset || 0);
  const filters = req.query.filters ? String(req.query.filters) : undefined;
  const result = await searchProducts(q, { limit, offset, filters });
  res.json(result);
});

router.get('/services', async (req, res) => {
  const q = String(req.query.q || '');
  const limit = Number(req.query.limit || 20);
  const offset = Number(req.query.offset || 0);
  const filters = req.query.filters ? String(req.query.filters) : undefined;
  const result = await searchServices(q, { limit, offset, filters });
  res.json(result);
});

export default router;
