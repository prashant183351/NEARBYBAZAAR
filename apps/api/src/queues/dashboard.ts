// Bull-board dashboard integration
import { Express } from 'express';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { emailQueue, webhookQueue, erpQueue, shippingQueue } from './index';

export function mountQueueDashboard(app: Express) {
  // Only mount dashboard if queues are initialized (not in test mode)
  if (emailQueue && webhookQueue && erpQueue && shippingQueue) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');
    createBullBoard({
      queues: [
        new BullMQAdapter(emailQueue),
        new BullMQAdapter(webhookQueue),
        new BullMQAdapter(erpQueue),
        new BullMQAdapter(shippingQueue),
      ],
      serverAdapter,
    });
    app.use('/admin/queues', serverAdapter.getRouter());
  }
}
