// Durable Scheduler: persistent, catch-up, and admin-controllable scheduled tasks
import { Model, Schema, model, Document } from 'mongoose';
import { logger } from '../utils/logger';

export interface IScheduledTask extends Document {
  name: string;
  cron: string; // e.g. '0 2 * * *'
  nextRun: Date;
  lastRun?: Date;
  paused: boolean;
  running: boolean;
  lastResult?: string;
  jitterMs?: number;
  catchUp: boolean;
}

const ScheduledTaskSchema = new Schema<IScheduledTask>({
  name: { type: String, required: true, unique: true },
  cron: { type: String, required: true },
  nextRun: { type: Date, required: true },
  lastRun: { type: Date },
  paused: { type: Boolean, default: false },
  running: { type: Boolean, default: false },
  lastResult: { type: String },
  jitterMs: { type: Number, default: 0 },
  catchUp: { type: Boolean, default: true },
});

export const ScheduledTask: Model<IScheduledTask> = model<IScheduledTask>('ScheduledTask', ScheduledTaskSchema);

// Stub for cron-parser
const cronParser = {
  parseExpression: (_expr: string) => {
    // Return a dummy object with next() method
    return {
      next: () => new Date(Date.now() + 60000), // next run in 1 min
    };
  },
};
export default cronParser;

export async function tickScheduler() {
  const now = new Date();
  const tasks = await ScheduledTask.find({ paused: false });
  for (const task of tasks) {
    if (task.running) {
      logger.warn(`[Scheduler] Task ${task.name} is still running, skipping.`);
      continue;
    }
    if (task.nextRun <= now) {
      // If catchUp is false and lastRun is after nextRun, skip missed runs
      if (!task.catchUp && task.lastRun && task.lastRun > task.nextRun) {
        logger.info(`[Scheduler] Skipping missed run for ${task.name}`);
        task.nextRun = getNextRun(task.cron, task.jitterMs);
        await task.save();
        continue;
      }
      // Mark as running
      task.running = true;
      await task.save();
      try {
        logger.info(`[Scheduler] Running task ${task.name}`);
        // Dynamically import and run the handler
        const handler = await import(`../scheduled/${task.name}`);
        const result = await handler.default();
        task.lastResult = result ? String(result) : 'ok';
      } catch (err: any) {
        logger.error(`[Scheduler] Error in task ${task.name}:`, err);
        task.lastResult = `Error: ${err.message}`;
      } finally {
        task.lastRun = new Date();
        task.nextRun = getNextRun(task.cron, task.jitterMs);
        task.running = false;
        await task.save();
      }
    }
  }
}

function getNextRun(cron: string, jitterMs = 0): Date {
  const interval = cronParser.parseExpression(cron);
  let next = interval.next();
  if (jitterMs) {
    next = new Date(next.getTime() + Math.floor(Math.random() * jitterMs));
  }
  return next;
}

// Admin controls
export async function pauseTask(name: string) {
  await ScheduledTask.updateOne({ name }, { paused: true });
}
export async function resumeTask(name: string) {
  await ScheduledTask.updateOne({ name }, { paused: false });
}
export async function runTaskNow(name: string) {
  const task = await ScheduledTask.findOne({ name });
  if (!task) throw new Error('Task not found');
  if (task.running) throw new Error('Task already running');
  task.nextRun = new Date();
  await task.save();
}
// To be called on server start (e.g. in a setInterval)
export function startScheduler(intervalMs = 60000) {
  setInterval(() => tickScheduler().catch(logger.error), intervalMs);
}
