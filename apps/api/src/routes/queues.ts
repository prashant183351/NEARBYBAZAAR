// Mount Bull-board dashboard route
import { Router } from 'express';
import { mountQueueDashboard } from '../queues/dashboard';

const router = Router();

// This will be mounted in app.ts
import { Express } from 'express';
export function setupQueuesRoute(app: Express) {
  // Only mount dashboard if not in test mode
  if (process.env.NODE_ENV !== 'test') {
    mountQueueDashboard(app);
  }
}

export default router;
