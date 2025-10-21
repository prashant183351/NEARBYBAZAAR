import mongoose from 'mongoose';
import { config } from '../config';
import { run as addVendorSlug } from './vendor/001-add-vendor-slug';

export async function runMigrations() {
    console.log('Running migrations...');
    if (!config.mongoUri) {
        throw new Error('MONGODB_URI not configured');
    }
    await mongoose.connect(config.mongoUri);
    try {
        // Idempotent migrations
        await addVendorSlug();
        console.log('Migrations completed');
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    runMigrations().catch((err) => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
}
