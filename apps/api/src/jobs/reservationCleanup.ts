import { Queue, Worker } from 'bullmq';
import { StockReservation } from '../models/StockReservation';
import { logger } from '@nearbybazaar/lib';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};

// Queue for reservation cleanup
export const reservationCleanupQueue = new Queue('reservation-cleanup', { connection });

/**
 * Job to release expired stock reservations
 * Runs every 5 minutes
 */
export async function startReservationCleanupWorker(): Promise<void> {
  const worker = new Worker(
    'reservation-cleanup',
    async () => {
      logger.info('Starting reservation cleanup job');

      try {
        const releasedCount =
          await StockReservation.schema.statics.releaseExpiredReservations.call(StockReservation);

        logger.info(`Released ${releasedCount} expired reservations`);

        return { releasedCount, timestamp: new Date() };
      } catch (error) {
        logger.error('Error in reservation cleanup job');
        logger.error(error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 1, // Only one cleanup job at a time
    },
  );

  worker.on('completed', (job) => {
    logger.info(
      `Reservation cleanup job ${job.id} completed with ${job.returnvalue?.releasedCount || 0} released`,
    );
  });

  worker.on('failed', (job, err) => {
    logger.error(`Reservation cleanup job ${job?.id} failed`);
    logger.error(err);
  });

  // Schedule repeating job every 5 minutes
  await reservationCleanupQueue.add(
    'cleanup-expired',
    {},
    {
      repeat: {
        pattern: '*/5 * * * *', // Every 5 minutes
      },
      removeOnComplete: 10, // Keep last 10 completed jobs
      removeOnFail: 50, // Keep last 50 failed jobs
    },
  );

  logger.info('Reservation cleanup worker started (runs every 5 minutes)');
}

/**
 * Manually trigger cleanup job (for testing or admin use)
 */
export async function triggerReservationCleanup(): Promise<void> {
  await reservationCleanupQueue.add('cleanup-manual', {}, { priority: 1 });
}
