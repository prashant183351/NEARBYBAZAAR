import mongoose from 'mongoose';
import { Commission } from '../models/Commission';

export async function seedCommissions() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nearbybazaar');

  const commissions = [
    { name: 'Default Percentage', type: 'percentage', value: 10 },
    { name: 'Fixed for Electronics', type: 'fixed', value: 5, category: 'electronics' },
    {
      name: 'Tiered for Luxury',
      type: 'tiered',
      tiers: [
        { min: 0, max: 1000, rate: 5 },
        { min: 1000, max: 5000, rate: 3 },
        { min: 5000, rate: 2 },
      ],
      category: 'luxury',
    },
  ];

  for (const commission of commissions) {
    await Commission.findOneAndUpdate(
      { name: commission.name },
      { $set: commission },
      { upsert: true, new: true },
    );
  }

  console.log('Seeded commission rules.');
  await mongoose.disconnect();
}

if (require.main === module) {
  seedCommissions().catch(console.error);
}
