import { Queue, Worker, Job } from 'bullmq';
import { Vendor } from '../models/Vendor';
import { ERPConnector } from '../services/erp/types';
import { MockERPConnector } from '../services/erp/types';

const connection = { host: 'localhost', port: 6379 };
const erpQueue = new Queue('erp-sync', { connection });
// If QueueScheduler is not available, you can omit this line or update bullmq to a version that supports it.
// new QueueScheduler('erp-sync', { connection });
// Nightly job with jitter
export async function scheduleNightlyERPJobs() {
  const vendors = await Vendor.find({ integrationEnabled: true }).lean();
  for (const vendor of vendors) {
    // Add jitter: random delay up to 30 minutes
    const jitterMs = Math.floor(Math.random() * 30 * 60 * 1000);
    await erpQueue.add(
      'erp-sync',
      { vendorId: vendor._id },
      {
        repeat: { pattern: '0 2 * * *' }, // 2am UTC nightly
        delay: jitterMs,
        removeOnComplete: true,
        backoff: { type: 'exponential', delay: 60000 }, // 1 min base backoff
      },
    );
  }
}

// Worker to process jobs
new Worker(
  'erp-sync',
  async (job: Job) => {
    const { vendorId } = job.data;
    // Replace with actual connector selection logic
    const connector: ERPConnector = MockERPConnector;
    // Example: run exportOrders
    await connector.exportOrders({ version: 1, orders: [] });
    // Log summary
    console.log(`[ERP SYNC] Vendor ${vendorId} job complete at ${new Date().toISOString()}`);
  },
  { connection },
);
