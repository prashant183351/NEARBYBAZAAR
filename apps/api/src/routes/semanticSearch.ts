import { Router } from 'express';
import { semanticSearch } from '../services/searchVector';
import { logger } from '../utils/logger';

const router = Router();

// POST /v1/semantic-search
router.post('/semantic-search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, error: 'Missing query' });
    const results = await semanticSearch(query);
    res.json({ success: true, data: results });
  } catch (err) {
    logger.error('Semantic search error', err);
    res.status(500).json({ success: false, error: 'Semantic search failed' });
  }
});

export default router;
