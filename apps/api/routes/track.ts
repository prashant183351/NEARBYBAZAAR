import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
  const { event, data } = req.body;

  if (!event) {
    return res.status(400).json({ error: 'Event type is required' });
  }

  console.log(`Event: ${event}`, data);

  // TODO: Save the event and data to a database or analytics service

  res.status(200).json({ message: 'Event tracked successfully' });
});

export default router;
