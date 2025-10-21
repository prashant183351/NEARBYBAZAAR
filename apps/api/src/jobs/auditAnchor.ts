import { Queue, Worker } from 'bullmq';
import { getLatestAuditHash } from '../models/ImmutableAudit';
import { sendMail } from '../services/mailer';
import { getRedis } from '../services/redis';

const QUEUE_NAME = 'audit-anchor';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@nearbybazaar.com';
const ANCHOR_ENABLED = process.env.AUDIT_ANCHOR_ENABLED !== 'false';

// Create queue for audit anchoring
const redis = getRedis();
export const auditAnchorQueue = ANCHOR_ENABLED && redis
    ? new Queue(QUEUE_NAME, { connection: redis })
    : null;

/**
 * Schedule daily audit anchor job
 * Runs at 23:59 UTC daily to email the day's final audit hash
 */
export async function scheduleDailyAnchor() {
    if (!auditAnchorQueue) {
        console.warn('Audit anchor queue disabled (Redis unavailable or disabled)');
        return;
    }

    await auditAnchorQueue.add(
        'daily-anchor',
        {},
        {
            repeat: {
                pattern: '59 23 * * *', // Daily at 23:59 UTC
            },
            jobId: 'daily-audit-anchor',
        }
    );

    console.log('Daily audit anchor job scheduled');
}

/**
 * Worker to process audit anchor jobs
 */
if (ANCHOR_ENABLED && redis && process.env.NODE_ENV !== 'test') {
    const worker = new Worker(
        QUEUE_NAME,
        async (_job) => {
            console.log('Running daily audit anchor job...');

            const latestHash = await getLatestAuditHash();

            if (!latestHash) {
                console.log('No audit logs to anchor');
                return { success: true, message: 'No logs to anchor' };
            }

            const today = new Date().toISOString().split('T')[0];
            const subject = `[NearbyBazaar] Daily Audit Anchor - ${today}`;
            const text = `Daily Audit Log Anchor
            
Date: ${today}
Latest Audit Hash: ${latestHash}

This hash represents the chain state of all audit logs up to this point.
Store this email securely as proof of audit log state.

To verify audit integrity, use this hash as a checkpoint.

---
NearbyBazaar Audit System
`;

            try {
                await sendMail({
                    to: ADMIN_EMAIL,
                    subject,
                    text,
                });

                console.log(`Audit anchor email sent to ${ADMIN_EMAIL}`);
                return { success: true, hash: latestHash, sentTo: ADMIN_EMAIL };
            } catch (error) {
                console.error('Failed to send audit anchor email:', error);
                throw error;
            }
        },
        {
            connection: redis,
        }
    );

    worker.on('completed', (job) => {
        console.log(`Audit anchor job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        console.error(`Audit anchor job ${job?.id} failed:`, err);
    });
}

/**
 * Manually trigger an audit anchor (for testing or on-demand use)
 */
export async function triggerAuditAnchor(): Promise<string | null> {
    if (!auditAnchorQueue) {
        throw new Error('Audit anchor queue is not available');
    }

    await auditAnchorQueue.add('manual-anchor', {}, { priority: 1 });
    return await getLatestAuditHash();
}
