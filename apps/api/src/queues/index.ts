import { Queue, Worker } from 'bullmq';
let QueueScheduler: any;
try {
  QueueScheduler = require('bullmq').QueueScheduler;
} catch {
  QueueScheduler = undefined;
}
import { sendAlertEmail } from '../services/mailer';
import IORedis from 'ioredis';
import { getEnv } from '../utils/secrets';
import { logger } from '../utils/logger';

const shouldInitQueues = process.env.NODE_ENV !== 'test' && process.env.NO_QUEUE !== 'true';
let connection: IORedis | undefined;

const defaultQueueOpts = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: true,
  removeOnFail: 100,
};

export let emailQueue: Queue;
export let webhookQueue: Queue;
export let erpQueue: Queue;
export let shippingQueue: Queue;
export let emailWorker: Worker | undefined;

if (shouldInitQueues) {
  connection = new IORedis(getEnv('REDIS_URL'));
  emailQueue = new Queue('email', { connection, ...defaultQueueOpts });
  webhookQueue = new Queue('webhook', { connection, ...defaultQueueOpts });
  erpQueue = new Queue('erp', { connection, ...defaultQueueOpts });
  shippingQueue = new Queue('shipping', { connection, ...defaultQueueOpts });

  // QueueSchedulers for delayed/repeat jobs
  if (QueueScheduler) {
    new QueueScheduler('email', { connection });
    new QueueScheduler('webhook', { connection });
    new QueueScheduler('erp', { connection });
    new QueueScheduler('shipping', { connection });
  }

  function setupWorker(queueName: string, processor: any) {
    if (!connection) {
      throw new Error('Redis connection is undefined. Cannot start worker.');
    }
    const worker = new Worker(queueName, processor, { connection });
    worker.on('failed', async (job: any, err) => {
      if (!job) {
        logger.error({ queue: queueName, err }, 'Job failed (no job info)');
        return;
      }
      logger.error({ queue: queueName, jobId: job.id, err }, 'Job failed');
      if (job.attemptsMade >= (job.opts.attempts || 5)) {
        logger.warn({ queue: queueName, jobId: job.id }, 'Job moved to dead-letter');
        await sendAlertEmail(
          getEnv('ADMIN_EMAIL'),
          `Queue ${queueName} job ${job.id} failed after max retries`,
          `Error: ${err.message}`,
        );
      }
    });
    return worker;
  }

  // Example: email worker
  emailWorker = setupWorker('email', async (job: any) => {
    if (job.data.poison) throw new Error('Poison pill!');
    // ...actual email sending logic...
  });
  setupWorker('webhook', async (_job: any) => {
    // ...webhook logic...
  });
  setupWorker('erp', async (_job: any) => {
    // ...ERP sync logic...
  });
  setupWorker('shipping', async (_job: any) => {
    // ...shipping logic...
  });
} else {
  // Provide a minimal no-op queue interface for tests
  emailQueue = {
    add: async () => Promise.resolve(),
  } as any;
  webhookQueue = {
    add: async () => Promise.resolve(),
  } as any;
  erpQueue = {
    add: async () => Promise.resolve(),
  } as any;
  shippingQueue = {
    add: async () => Promise.resolve(),
  } as any;
}

export const queues = {
  email: emailQueue,
  webhook: webhookQueue,
  erp: erpQueue,
  shipping: shippingQueue,
};
