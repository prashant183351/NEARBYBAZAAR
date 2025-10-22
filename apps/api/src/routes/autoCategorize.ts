import { Router } from 'express';
import { suggestCategoryForProduct, batchSuggestCategories } from '../services/autoCategorize';
import { Product } from '../models/Product';
import { logger } from '../utils/logger';

const router = Router();

// POST /v1/auto-categorize/suggest
router.post('/auto-categorize/suggest', async (req, res) => {
  try {
    const { product } = req.body;
    if (!product) return res.status(400).json({ success: false, error: 'Missing product' });
    const cat = await suggestCategoryForProduct(product);
    res.json({ success: true, category: cat });
  } catch (err) {
    logger.error('Auto-categorize error', err);
    res.status(500).json({ success: false, error: 'Failed to suggest category' });
  }
});

// GET /v1/auto-categorize/batch
router.get('/auto-categorize/batch', async (_req, res) => {
  try {
    const suggestions = await batchSuggestCategories(20);
    res.json({ success: true, data: suggestions });
  } catch (err) {
    logger.error('Batch auto-categorize error', err);
    res.status(500).json({ success: false, error: 'Failed to batch suggest categories' });
  }
});

// POST /v1/auto-categorize/approve
router.post('/auto-categorize/approve', async (req, res) => {
  try {
    const { productId, categoryId } = req.body;
    if (!productId || !categoryId)
      return res.status(400).json({ success: false, error: 'Missing productId or categoryId' });
    await Product.findByIdAndUpdate(productId, { category: categoryId });
    res.json({ success: true });
  } catch (err) {
    logger.error('Approve auto-categorize error', err);
    res.status(500).json({ success: false, error: 'Failed to approve category' });
  }
});

export default router;
