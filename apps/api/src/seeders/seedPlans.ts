import { ClassifiedPlan } from '../models/ClassifiedPlan';
import { Subscription } from '../models/Subscription';
import { Vendor } from '../models/Vendor';

export async function seedPlansAndAssignments() {
  // Seed default plans
  const plans = [
    { name: 'Free', tier: 'Free', maxListings: 5, features: [], price: 0, currency: 'INR' },
    {
      name: 'Pro',
      tier: 'Pro',
      maxListings: 20,
      features: ['featured', 'extra_images'],
      price: 100,
      currency: 'INR',
    },
    {
      name: 'Featured',
      tier: 'Featured',
      maxListings: 50,
      features: ['featured', 'extra_images'],
      price: 200,
      currency: 'INR',
    },
  ];
  for (const plan of plans) {
    await ClassifiedPlan.updateOne({ name: plan.name }, plan, { upsert: true });
  }

  // Assign Free plan to a sample vendor (prefer specific, fallback to first available)
  let vendor = await Vendor.findOne({ email: 'sample@vendor.com' });
  if (!vendor) {
    vendor = await Vendor.findOne({ email: 'store@sample-vendor.dev' });
  }
  if (!vendor) {
    vendor = await Vendor.findOne({});
  }
  const freePlan = await ClassifiedPlan.findOne({ name: 'Free' });
  if (vendor && freePlan) {
    await Subscription.updateOne(
      { vendor: vendor._id },
      { vendor: vendor._id, plan: freePlan._id, startDate: new Date(), status: 'active' },
      { upsert: true },
    );
  }
}

if (require.main === module) {
  seedPlansAndAssignments().then(() => {
    console.log('Seeded plans and sample vendor assignment.');
    process.exit(0);
  });
}
