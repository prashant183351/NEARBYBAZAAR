# Durable Scheduler (Chunk 191)

## Features

- Persistent scheduled tasks in MongoDB (`ScheduledTask` model)
- Supports cron syntax, jitter, catch-up, pause/resume, run-now
- Backpressure: skips if last run still running
- Missed runs: can skip or catch up (configurable)
- Admin controls: pause/resume, run now
- Each task is a file in `src/scheduled/{taskName}.ts` exporting a default async function
- All state (last run, next run, result, running) is persisted

## Usage

- Add a task: create a `ScheduledTask` document with `name`, `cron`, `nextRun`, etc.
- Implement handler: add `src/scheduled/{name}.ts` with `export default async function()`
- Scheduler runs every minute (configurable)
- Call `startScheduler()` on server start
- Use `pauseTask(name)`, `resumeTask(name)`, `runTaskNow(name)` for admin control

## Example

```js
import { startScheduler } from './services/scheduler';
startScheduler();
```

## Testing

- Simulate downtime: pause scheduler, advance time, resume, see if catch-up/skip works
- Check DB for task state

## Security

- Only admin should be able to pause/resume/run tasks (expose via admin UI or API)

## References

- [cron-parser](https://github.com/harrisiirak/cron-parser)
