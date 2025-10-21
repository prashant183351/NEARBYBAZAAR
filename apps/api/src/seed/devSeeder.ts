import mongoose from 'mongoose';
import { User } from '../models/User';
import { Vendor } from '../models/Vendor';

export async function seedDev() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nearbybazaar');

    // Seed admin user
    const admin = await User.findOneAndUpdate(
        { email: 'admin@nearbybazaar.dev' },
        { $setOnInsert: { name: 'Admin', password: 'admin123', role: 'admin' } },
        { upsert: true, new: true }
    );

    // Seed sample vendor
    await Vendor.findOneAndUpdate(
        { email: 'vendor@nearbybazaar.dev' },
        { $setOnInsert: { name: 'Sample Vendor', owner: admin._id } },
        { upsert: true, new: true }
    );

    console.log('Seeded admin user and sample vendor.');
    await mongoose.disconnect();
}

if (require.main === module) {
    seedDev().catch(console.error);
}
