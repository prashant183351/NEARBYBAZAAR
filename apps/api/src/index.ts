// --- OpenTelemetry Tracing ---
import { startOtel } from './telemetry/otel';
// Start OpenTelemetry before anything else
startOtel();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './utils/errors';
import { emailQueue } from './queues';
import { apiSuccess, apiError } from './utils/apiResponse';

dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

// Register booking/inquiry routes
import inquiryRouter from './routes/inquiry';
import bookingRouter from './routes/booking';
app.use('/inquiry', inquiryRouter);
app.use('/booking', bookingRouter);

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || '';



app.get('/health', (_req, res) => {
    res.json(apiSuccess({ status: 'ok', timestamp: new Date().toISOString() }));
});

// Test error route to demonstrate error envelope
app.get('/test-error', (_req, res) => {
    res.status(400).json(apiError('This is a test error', 'TEST_ERROR'));
});

// Test route to enqueue an email job
app.post('/test-email', async (req, res) => {
    const { to, subject, text, html } = req.body;
    await emailQueue.add('send', { to, subject, text, html });
    res.json({ queued: true });
});


// Email worker is not started here; ensure worker is started elsewhere if needed.

app.use(errorHandler);

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`API server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
