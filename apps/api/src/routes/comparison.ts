import express from 'express';
import { ComparisonItem } from '../models/ComparisonItem';

const router = express.Router();

// Add item to comparison tray
router.post('/compare', async (req, res) => {
  const { userId, itemId, itemType } = req.body;

  try {
    let comparison = await ComparisonItem.findOne({ userId });

    if (!comparison) {
      comparison = new ComparisonItem({ userId, items: [] });
    }

    comparison.items.push({ itemId, itemType });
    await comparison.save();

    res.status(200).json({ success: true, comparison });
  } catch (error) {
  res.status(500).json({ success: false, message: String(error) });
  }
});

// Get comparison tray items
router.get('/compare/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const comparison = await ComparisonItem.findOne({ userId });

    if (!comparison) {
      return res.status(404).json({ success: false, message: 'No comparison tray found' });
    }

    res.status(200).json({ success: true, comparison });
  } catch (error) {
  res.status(500).json({ success: false, message: String(error) });
  }
});

export default router;