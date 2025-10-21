# Queues Monitoring & BullMQ Dashboard

## Features
- Centralized queue definitions (email, webhook, ERP, shipping)
- Standardized retry/backoff (5 attempts, exponential)
- Poison pill detection: jobs failing max attempts move to dead-letter, alert sent
- Bull-board dashboard at `/admin/queues` for live monitoring
- QueueScheduler for delayed/repeat jobs
- Alert email sent to ADMIN_EMAIL on repeated failures

## Setup
- Add `mountQueueDashboard(app)` in API app bootstrap (see `routes/queues.ts`)
- Requires env: REDIS_URL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, ADMIN_EMAIL
- Install: `pnpm add bullmq bull-board nodemailer ioredis -w`

## Testing
- Submit a job with `{poison: true}` to emailQueue to simulate poison pill
- Check dashboard for dead-letter jobs
- Confirm alert email is sent

## Security
- Restrict `/admin/queues` route in production (add RBAC guard)

## References
- [BullMQ](https://docs.bullmq.io/)
- [Bull-board](https://github.com/felixmosh/bull-board)
