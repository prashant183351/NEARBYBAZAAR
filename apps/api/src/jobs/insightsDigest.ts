import { Queue } from 'bullmq';
import { Kaizen } from '../models/Kaizen';
import { Experiment } from '../models/Experiment';
import { Decision } from '../models/Decision';
// import { sendEmail } from '../services/email';

const emailQueue = new Queue('email');

export async function sendWeeklyInsightsDigest() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ideas = await Kaizen.find({ createdAt: { $gte: weekAgo } });
  const experiments = await Experiment.find({ updatedAt: { $gte: weekAgo } });
  const decisions = await Decision.find({ createdAt: { $gte: weekAgo } });

  let body = `# Weekly Kaizen Insights\n\n`;
  body += `## New Ideas\n`;
  for (const idea of ideas) {
    body += `- ${idea.title}\n`;
  }
  body += `\n## Experiment Updates\n`;
  for (const exp of experiments) {
    body += `- ${exp.title}: ${exp.status}\n`;
  }
  body += `\n## Decisions\n`;
  for (const dec of decisions) {
    body += `- ${dec.title}\n`;
  }
  body += `\n---\nTo unsubscribe, click here or update your notification settings.`;

  await emailQueue.add(
    'insightsDigest',
    {
      to: 'team@nearbybazaar.com',
      subject: 'Weekly Kaizen Insights Digest',
      body,
      isMarkdown: true,
    },
    { repeat: { every: 7 * 24 * 60 * 60 * 1000 } },
  );
}

if (require.main === module) {
  sendWeeklyInsightsDigest().then(() => {
    console.log('Weekly insights digest job scheduled.');
    process.exit(0);
  });
}
