import { Queue } from 'bullmq';
import { Subscription } from '../models/Subscription';
import { Vendor } from '../models/Vendor';
// import { sendEmail } from '../services/email';
import { getI18nTemplate } from '../services/i18n';

const emailQueue = new Queue('email');

export async function scheduleRenewalReminders() {
  // Find subscriptions expiring in 5 days
  const now = new Date();
  const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const subs = await Subscription.find({
    status: 'active',
    endDate: { $gte: now, $lte: fiveDaysLater },
  });
  for (const sub of subs) {
    const vendor = await Vendor.findById(sub.vendor);
    if (!vendor || !vendor.email) continue;
    // Schedule email job for 5 days before expiry
    if (sub.endDate) {
      const delay = sub.endDate.getTime() - now.getTime() - 5 * 24 * 60 * 60 * 1000;
      if (delay > 0) {
        await emailQueue.add(
          'renewalReminder',
          {
            to: vendor.email,
            subject: getI18nTemplate('renewal.subject', vendor.language || 'en', {
              plan: sub.plan,
            }),
            body: getI18nTemplate('renewal.body', vendor.language || 'en', {
              plan: sub.plan,
              endDate: sub.endDate,
            }),
          },
          { delay },
        );
      }
    }
  }
}
