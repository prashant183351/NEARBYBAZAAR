/**
 * Dispute SLA Queue
 *
 * Uses BullMQ delayed jobs to auto-escalate disputes when vendor misses SLA.
 */
import { Queue, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { Dispute, DisputeStatus } from '../models/Dispute';
import { emailQueue } from '.';

const shouldInitQueues = process.env.NODE_ENV !== 'test' && process.env.NO_QUEUE !== 'true';

let connection: IORedis | undefined;
let queue: Queue | undefined;
let worker: Worker | undefined;

if (shouldInitQueues) {
  connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null as unknown as number,
  } as any);

  queue = new Queue('dispute-sla', { connection });

  worker = new Worker(
    'dispute-sla',
    async (job) => {
      const { disputeId } = job.data as { disputeId: string };
      const dispute = await Dispute.findById(disputeId);
      if (!dispute) return;

      // If still open and no vendor response by SLA, escalate
      if (
        dispute.status === DisputeStatus.OPEN &&
        new Date() >= dispute.slaRespondBy &&
        !dispute.respondedAt
      ) {
        await dispute.escalate('Auto-escalated due to SLA breach');
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        await emailQueue.add('send', {
          to: adminEmail,
          subject: `Dispute auto-escalated ${dispute._id}`,
          text: `Dispute ${dispute._id} has been escalated due to no vendor response within SLA.`,
        });
      }
    },
    { connection },
  );
}

export const disputeSLAQueue = queue as Queue;
export const disputeSLAWorker = worker as Worker;

/**
 * Enqueue SLA job to run at dispute.slaRespondBy
 */
export async function scheduleSLAJob(disputeId: string, runAt: Date) {
  if (!disputeSLAQueue) return;
  const delay = Math.max(0, runAt.getTime() - Date.now());
  const opts: JobsOptions = { delay, removeOnComplete: true, removeOnFail: true };
  await disputeSLAQueue.add('sla-check', { disputeId }, opts);
}
