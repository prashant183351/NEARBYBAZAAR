import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Liveness probe
router.get('/livez', (_req, res) => {
  res.status(200).send('OK');
});

// Readiness probe
router.get('/readyz', async (_req, res) => {
  // Check DB connection
  const state = mongoose.connection.readyState;
  // 1 = connected, 2 = connecting
  if (state === 1) {
    res.status(200).send('OK');
  } else {
    res.status(503).send('DB not ready');
  }
});

export default router;
