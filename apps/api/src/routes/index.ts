import { Router } from 'express';
import { health } from '../controllers/shared';
import adminRouter from './admin';
import abtestRouter from './abtest';
import inquiryRouter from './inquiry';
import bookingRouter from './booking';
import userRoutes from './user';
import vendorRoutes from './vendor';
import productsRouter from './products';
import servicesRouter from './services';
import classifiedsRouter from './classifieds';
import mediaRouter from './media';
import plansRouter from './plans';
import ordersRouter from './orders';
import bookingsRouter from './bookings';
import kaizenRouter from './kaizen';
import importRouter from './import';
import publicProductsRouter from './public/products';
import publicServicesRouter from './public/services';
import publicClassifiedsRouter from './public/classifieds';
import seoRouter from './seo';
import sitemapRouter from './sitemap';
import slugRouter from './slug';
import docsRouter from './docs';
import authRouter from './auth';
import otpRouter from '../auth/otp';
import webhooksRouter from './webhooks';
import checkoutRouter from './checkout';
import paymentsRouter from './payments';
import offersRouter from './offers';
import buyBoxRouter from './buyBox';
import disputesRouter from './disputes';
import searchRouter from './search';
import rfqRouter from './rfq';
import b2bRouter from './b2b';
import invoicesRouter from './invoices';
import creditRouter from './credit';
import reputationRouter from './reputation';
import vendorActionsRouter from './vendorActions';
import campaignsRouter from './campaigns';
import adTrackingRouter from './adTracking';
import adDashboardRouter from './adDashboard';
import warrantyClaimsRouter from './warrantyClaims';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ok
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get('/health', health);
router.use('/inquiry', inquiryRouter);
router.use('/booking', bookingRouter);
router.use('/users', userRoutes);
router.use('/vendors', vendorRoutes);
router.use('/products', productsRouter);
router.use('/services', servicesRouter);
router.use('/classifieds', classifiedsRouter);
router.use('/media', mediaRouter);
router.use('/plans', plansRouter);
router.use('/orders', ordersRouter);
router.use('/bookings', bookingsRouter);
router.use('/import', importRouter);
router.use('/admin', adminRouter);
router.use('/admin/abtest', abtestRouter);
router.use('/kaizen', kaizenRouter);
router.use('/public/products', publicProductsRouter);
router.use('/public/services', publicServicesRouter);
router.use('/public/classifieds', publicClassifiedsRouter);
router.use('/seo', seoRouter);
router.use('/sitemap', sitemapRouter);
router.use('/slug', slugRouter);
router.use('/docs', docsRouter);
router.use('/auth', authRouter);
router.use('/auth/otp', otpRouter);
router.use('/webhooks', webhooksRouter);
router.use('/payments', paymentsRouter);
router.use('/offers', offersRouter);
router.use('/buybox', buyBoxRouter);
router.use('/disputes', disputesRouter);
router.use('/search', searchRouter);
router.use('/rfq', rfqRouter);
router.use('/b2b', b2bRouter);
router.use('/invoices', invoicesRouter);
router.use('/credit', creditRouter);
router.use('/reputation', reputationRouter);
router.use('/vendor-actions', vendorActionsRouter);
router.use('/campaigns', campaignsRouter);
router.use('/ad-tracking', adTrackingRouter);
router.use('/ad-dashboard', adDashboardRouter);
router.use('/warranty-claims', warrantyClaimsRouter);
router.use('/', checkoutRouter);

export default router;
