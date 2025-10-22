import mongoose from 'mongoose';
import app from './app';
import { config } from './config';
import { emailWorker } from './queues';

mongoose
  .connect(config.mongoUri)
  .then(() => {
    app.listen(config.port, () => {
      console.log(`API server running on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Start email worker (in-process for dev)
if (emailWorker) {
  emailWorker.on('completed', (job) => {
    console.log(`Email job ${job.id} completed`);
  });
  emailWorker.on('failed', (job, err) => {
    console.error(`Email job ${job?.id} failed:`, err);
  });
}
