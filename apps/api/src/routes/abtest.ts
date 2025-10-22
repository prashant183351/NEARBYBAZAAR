import { Router } from 'express';
import { ABTest } from '../models/ABTest';

const router = Router();

// List all A/B tests
router.get('/', async (_req, res) => {
  const tests = await ABTest.find().sort({ startedAt: -1 });
  res.json({ success: true, data: tests });
});

// Create a new A/B test
router.post('/', async (req, res) => {
  try {
    const test = new ABTest(req.body);
    await test.save();
    res.json({ success: true, data: test });
  } catch (e) {
    res.status(400).json({ success: false, error: String(e) });
  }
});

// Update A/B test (e.g., enable/disable, end, update results)
router.put('/:id', async (req, res) => {
  try {
    const test = await ABTest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: test });
  } catch (e) {
    res.status(400).json({ success: false, error: String(e) });
  }
});

// Get results for a specific test
router.get('/:id/results', async (req, res) => {
  const test = await ABTest.findById(req.params.id);
  if (!test) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({
    success: true,
    data: {
      variantA: test.variantA,
      variantB: test.variantB,
      startedAt: test.startedAt,
      endedAt: test.endedAt,
    },
  });
});

export default router;
