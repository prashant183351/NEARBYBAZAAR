import mongoose from 'mongoose';
import { ClassifiedPlan } from '../models/ClassifiedPlan';

export async function seedPlans() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nearbybazaar');

    const plans = [
        { name: 'Free', tier: 'Free', maxListings: 1, features: [], price: 0 },
        { name: 'Pro', tier: 'Pro', maxListings: 10, features: ['priority', 'longer duration'], price: 9.99 },
        { name: 'Featured', tier: 'Featured', maxListings: 50, features: ['priority', 'highlight', 'longest duration'], price: 29.99 },
    ];

    for (const plan of plans) {
        await ClassifiedPlan.findOneAndUpdate(
            { tier: plan.tier },
            { $set: plan },
            { upsert: true, new: true }
        );
    }

    console.log('Seeded default classified plans.');
    await mongoose.disconnect();
}

if (require.main === module) {
    seedPlans().catch(console.error);
}
