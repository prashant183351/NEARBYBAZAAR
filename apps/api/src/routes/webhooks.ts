import { Router, Request, Response } from 'express';
import { idempotency } from '../middleware/idempotency';
import { logger } from '../middleware/logging';

const router = Router();

/**
 * Example webhook endpoint with idempotency
 * Webhooks often retry on failure, so idempotency prevents duplicate processing
 */
router.post(
  '/example',
  idempotency({ required: true, ttl: 3600 }),
  async (req: Request, res: Response) => {
    try {
      req.log.info({ body: req.body }, 'Webhook received');

      // Simulate webhook processing
      const { event, data } = req.body;

      req.log.info({ event, dataId: data?.id }, 'Processing webhook event');

      // Process webhook based on event type
      // This would be your actual webhook logic

      res.json({
        success: true,
        message: 'Webhook processed successfully',
        requestId: req.id,
      });
    } catch (error) {
      req.log.error({ err: error }, 'Webhook processing failed');
      res.status(500).json({
        success: false,
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: 'Failed to process webhook',
        },
      });
    }
  },
);

/**
 * PhonePe payment webhook
 * Must be idempotent to handle retries
 */
router.post(
  '/phonepe',
  idempotency({ required: true, ttl: 86400 }),
  async (req: Request, res: Response) => {
    try {
      const { transactionId, status, amount } = req.body;

      req.log.info(
        {
          transactionId,
          status,
          amount,
        },
        'PhonePe webhook received',
      );

      // TODO: Verify webhook signature
      // TODO: Update order status
      // TODO: Process commission
      // TODO: Notify vendor and buyer

      res.json({
        success: true,
        transactionId,
        requestId: req.id,
      });
    } catch (error) {
      req.log.error({ err: error }, 'PhonePe webhook processing failed');
      res.status(500).json({
        success: false,
        error: {
          code: 'PAYMENT_WEBHOOK_FAILED',
          message: 'Failed to process payment webhook',
        },
      });
    }
  },
);

/**
 * ERP sync webhook
 * External systems may retry, so must be idempotent
 */
router.post('/erp-sync', idempotency({ ttl: 7200 }), async (req: Request, res: Response) => {
  try {
    const { syncId, data } = req.body;

    req.log.info({ syncId, recordCount: data?.length }, 'ERP sync webhook received');

    // TODO: Process ERP data sync

    res.json({
      success: true,
      syncId,
      processed: data?.length || 0,
      requestId: req.id,
    });
  } catch (error) {
    req.log.error({ err: error }, 'ERP sync webhook processing failed');
    res.status(500).json({
      success: false,
      error: {
        code: 'ERP_SYNC_FAILED',
        message: 'Failed to process ERP sync',
      },
    });
  }
});

/**
 * Test endpoint to verify idempotency key functionality
 * Useful for development and testing
 */
if (process.env.NODE_ENV !== 'production') {
  router.post(
    '/test-idempotency',
    idempotency({ required: true }),
    (req: Request, res: Response) => {
      const timestamp = new Date().toISOString();
      logger.info({ timestamp, requestId: req.id }, 'Test idempotency endpoint called');

      res.json({
        success: true,
        message: 'This response should be cached',
        timestamp,
        requestId: req.id,
      });
    },
  );
}

export default router;
