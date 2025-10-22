import express from 'express';

const app = express();

// Debugging middleware to log the raw request body
app.use((req, _res, next) => {
  console.log('Raw request body:', req.body); // Log raw body before parsing
  next();
});

// Apply JSON body parser globally
app.use(express.json());

// Debugging middleware to log the parsed request body
app.use((req, _res, next) => {
  console.log('Parsed request body:', req.body); // Log parsed body after parsing
  next();
});

import gstnRoutes from './routes/gstn';
app.use('/v1/gstn', gstnRoutes);
import hyperlocalDeliveryRoutes from './routes/hyperlocalDelivery';
import shippingBiddingRoutes from './routes/shippingBidding';
import reverseLogisticsRoutes from './routes/reverseLogistics';
import vendorReturnsRoutes from './routes/vendorReturns';
import vendorCodRoutes from './routes/vendorCod';
import ordersCodRoutes from './routes/ordersCod';
import bnplRoutes from './routes/bnpl'; // Import BNPL routes
// (import for autoCategorizeRoutes moved below)
// (imports for feature routes moved below)
import { startScheduler } from './services/scheduler';

if (process.env.NODE_ENV !== 'test') {
  startScheduler();
}
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './utils/errors';
import { jwtMiddleware } from './middleware/auth';
import { corsMiddleware } from './middleware/cors';
import { rateLimit } from './middleware/rateLimit';
import { pinoHttpLogger, attachRequestContext, logError } from './middleware/logging';
import routes from './routes';
import loyaltyRoutes from './routes/loyalty';
import media3dRoutes from './routes/media3d';
import healthRoutes from './routes/health';
import complianceRoutes from './routes/compliance';
import { setupQueuesRoute } from './routes/queues';
import { wafMiddleware } from './middleware/waf';
import blogRoutes from './routes/blog';
import customPaymentLinksRouter from './routes/customPaymentLinks';

import recommendationsRoutes from './routes/recommendations';
import analyticsRoutes from './routes/analytics';
import semanticSearchRoutes from './routes/semanticSearch';
import autoCategorizeRoutes from './routes/autoCategorize';
import comparisonRoutes from './routes/comparison';
import trackRouter from '../routes/track';
import finnbizRoutes from './routes/finnbiz';
import adExchangeRouter from './routes/adExchange';
import retargetingRoutes from './routes/retargeting';
import videoAdsRoutes from './routes/videoAds';
import adAnalyticsRoutes from './routes/adAnalytics';
import qaRoutes from './routes/qa';
import followWishlistRoutes from './routes/followWishlist';

// Feature routes (after core middleware)
app.use(reverseLogisticsRoutes);
app.use(vendorReturnsRoutes);
app.use(vendorCodRoutes);
app.use(ordersCodRoutes);
app.use('/v1', shippingBiddingRoutes);
app.use('/v1', hyperlocalDeliveryRoutes);
app.use(recommendationsRoutes);
app.use(analyticsRoutes);
app.use(semanticSearchRoutes);
app.use('/v1', shippingBiddingRoutes);
app.use(autoCategorizeRoutes);
app.use('/api', comparisonRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api', customPaymentLinksRouter);
app.use('/api/track', trackRouter);
app.use('/api', finnbizRoutes);
app.use('/v1', adExchangeRouter);
app.use('/api', retargetingRoutes);
app.use('/api', videoAdsRoutes);
app.use('/api', adAnalyticsRoutes);
app.use('/api', bnplRoutes); // Use BNPL routes
app.use('/api', qaRoutes); // Use Q&A routes
app.use('/api', followWishlistRoutes); // Use Follow & Wishlist routes

// Logging middleware (must be first to log all requests)
app.use(pinoHttpLogger);
app.use(attachRequestContext);

// Security middleware
app.use(corsMiddleware);
app.use(helmet());
app.use(compression());

// Attach req.user if Authorization: Bearer is present
app.use(jwtMiddleware);

// Global rate limiting (adaptive based on auth status)
app.use(rateLimit());

// WAF middleware
app.use(wafMiddleware);

// Feature routes (after core middleware)
app.use(recommendationsRoutes);
app.use(analyticsRoutes);
app.use(semanticSearchRoutes);

app.use('/v1', routes);
app.use('/v1/loyalty', loyaltyRoutes);
app.use('/v1/media/3d', media3dRoutes);
app.use(healthRoutes);
app.use(complianceRoutes);
app.use(rateLimit());

app.use('/v1', routes);
setupQueuesRoute(app); // Mount Bull-board dashboard at /admin/queues

// Error logging middleware (before error handler)
app.use(logError);
app.use(errorHandler);

export default app;
