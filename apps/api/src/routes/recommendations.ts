import { Router } from 'express';
import { getUserRecommendations, getTrendingProducts, getVendorTrendingProducts, getFrequentlyBoughtTogether, getCustomersAlsoViewed } from '../services/recommendation';
import { logger } from '../utils/logger';

const router = Router();

// GET /v1/recommendations/:userId
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const recs = await getUserRecommendations(userId, 10);
    res.json({ success: true, data: recs });
  } catch (err) {
    logger.error('Recommendation error', err);
    res.status(500).json({ success: false, error: 'Failed to get recommendations' });
  }
});

// GET /v1/recommendations/trending
router.get('/recommendations/trending', async (_req, res) => {
  try {
    const recs = await getTrendingProducts(10);
    res.json({ success: true, data: recs });
  } catch (err) {
    logger.error('Trending error', err);
    res.status(500).json({ success: false, error: 'Failed to get trending products' });
  }
});

// GET /v1/recommendations/vendor/:vendorId
router.get('/recommendations/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const recs = await getVendorTrendingProducts(vendorId, 10);
    res.json({ success: true, data: recs });
  } catch (err) {
    logger.error('Vendor trending error', err);
    res.status(500).json({ success: false, error: 'Failed to get vendor trending products' });
  }
});

// GET /v1/recommendations/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const products = await getUserRecommendations(userId);
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// GET /v1/recommendations/bought-together/:productId
router.get('/bought-together/:productId', async (req, res) => {
	const { productId } = req.params;
	try {
		const products = await getFrequentlyBoughtTogether(productId);
		res.json({ success: true, products });
	} catch (err) {
		res.status(500).json({ error: 'Failed to get bought together recommendations' });
	}
});

// GET /v1/recommendations/also-viewed/:productId
router.get('/also-viewed/:productId', async (req, res) => {
	const { productId } = req.params;
	try {
		const products = await getCustomersAlsoViewed(productId);
		res.json({ success: true, products });
	} catch (err) {
		res.status(500).json({ error: 'Failed to get also viewed recommendations' });
	}
});

export default router;
