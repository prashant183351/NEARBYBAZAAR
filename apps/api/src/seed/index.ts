import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../db';
import { seedDevData } from '../seeders/dev';
import { seedDropship } from '../seeders/dropship';
import { seedAgreements } from '../seeders/agreements';
import { seedPlansAndAssignments } from '../seeders/seedPlans';
import { seedKaizenExamples } from '../seeders/kaizen';

async function main() {
  const target = (process.argv[2] || 'dev').toLowerCase();
  await connectMongo();

  try {
    switch (target) {
      case 'dev':
        await seedDevData();
        break;
      case 'dropship':
        await seedDropship();
        break;
      case 'agreements':
        await seedAgreements();
        break;
      case 'plans':
        await seedPlansAndAssignments();
        break;
      case 'kaizen':
        await seedKaizenExamples();
        break;
      case 'all':
        await seedDevData();
        await seedPlansAndAssignments();
        await seedDropship();
        await seedAgreements();
        await seedKaizenExamples();
        break;
      default:
        console.error(`Unknown seed target: ${target}`);
        process.exitCode = 1;
    }
  } finally {
    await disconnectMongo();
  }
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  // Try to disconnect if possible
  mongoose.disconnect().finally(() => process.exit(1));
});
