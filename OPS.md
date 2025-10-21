# NearbyBazaar Operations Runbook (OPS.md)

This runbook guides operations and on-call engineers for deployment, scaling, backups, and incident response.

> This is a living document. Keep it updated as architecture and processes evolve.

## System overview
- Monorepo with pnpm workspaces:
  - API (Express + Mongoose), web/vendor/admin (Next.js)
  - Shared packages: lib, types, ui
- Data stores: MongoDB (primary), Redis (queues, rate limits, cache)
- Background jobs: BullMQ (email, ERP sync, supplier sync, etc.)

## Environments
- local: developer laptops (Docker Compose recommended)
- staging: pre-production validation (optional)
- production: live environment

Environment variables are documented in `.env.example` files. Use a secrets manager for production.

## Deployment

### Prerequisites
- Node 18/20 on servers or containerized deployments
- MongoDB and Redis provisioned and reachable by API
- Build artifacts or CI-based deployments

### CI/CD (summary)
- CI: build, lint, test (incl. E2E smoke). Artifacts (coverage, Playwright reports) uploaded on failure.
- CD: deploy API + PWAs. Suggested: GitHub Actions to build images/artifacts and deploy to your target (Kubernetes, VM, or PaaS).

### Manual deployment (reference)
```bash
# Build workspace (in CI or on server)
pnpm install --frozen-lockfile
pnpm -w build

# Start API (example, using node)
node apps/api/dist/index.js

# Start Next.js apps (build + start)
cd apps/web && next build && next start
cd apps/vendor && next build && next start
cd apps/admin && next build && next start
```

> Prefer a process manager (PM2/systemd) or containers with health checks for reliability.

### Environment configuration
- API: `MONGODB_URI`, `PORT`, email/redis credentials.
- Frontends: public envs as needed. Keep secrets server-side.

## Scaling strategy

### API
- Horizontal scale behind a load balancer; sticky sessions not required (JWT + stateless API). 
- Use connection pooling to MongoDB and Redis.
- Enable gzip (compression) and security headers (helmet).
- Rate limiting via Redis-based sliding window (already available in middleware modules).

### Next.js apps
- Deploy as serverless or standalone Node servers. Use caching/CDN for static assets.
- Consider ISR/SSG for heavy pages in future.

### MongoDB & Redis
- MongoDB: Replica set for HA; monitor connections and slow queries.
- Redis: Managed service or cluster if needed for throughput; persistence as required by queue semantics.

## Backups & disaster recovery

### MongoDB
- Use `mongodump` for logical backups or snapshots if using a managed service.
- Suggested schedule: daily full + hourly oplog/point-in-time if available.
- Retention: per business policy (e.g., 14–30 days).

### Redis
- RDB snapshots for minimal persistence needs; queues may prefer at-least-once processing.

### Scripts (reference)
- See `scripts/backup_mongo.sh` and future `scripts/backup.ts` in roadmap (Phase 12) for automated backups.
- Store backups offsite with encryption-at-rest. Periodically test restores.

### Restore procedure (high level)
1. Provision a fresh MongoDB instance.
2. Restore from latest verified backup (and oplog if used) to target time.
3. Point the API’s `MONGODB_URI` to the restored DB.
4. Validate application health and data integrity before making it live.

# Disaster Recovery & Security

## Backup Strategy
- All MongoDB backups are stored in append-only, write-protected directories.
- Backups are optionally geo-replicated to offsite/secondary data centers using rsync.
- Backup script: `scripts/backup_mongo_secure.sh`
- Restore script: `scripts/restore_mongo_secure.sh`

## Geo-Replication
- Set `GEO_REPLICA=true` to enable offsite sync.
- Replica host: `user@replica-host:/geo-backups/mongo/`

## Disaster Recovery Drills
- Simulate restore by running `restore_mongo_secure.sh <backup_file>`.
- Record RTO (Recovery Time Objective) and RPO (Recovery Point Objective) for each drill.
- Document results and update procedures as needed.

## Security
- Backups are chmod a-w (append-only) after creation.
- Only authorized users can access backup directories.
- Offsite backups are encrypted and transferred over SSH.

## Monitoring & Improvement
- Regularly test restore and failover procedures.
- Update this document with drill results and process improvements.

## Observability
- Logging: structured JSON using pino/pino-http (planned/partially implemented). Centralize logs (ELK/Cloud provider).
- Tracing/metrics: OpenTelemetry integration planned; capture request latency, DB spans, error rates.
- Alerts: Set thresholds on p95 latency, error ratio, queue failures.

## Incident response

### Severity levels
- SEV1: Full outage; major functionality broken for most users.
- SEV2: Partial outage; degraded performance or feature outage.
- SEV3: Minor issue; workarounds available.

### On-call checklist
1. Acknowledge alert; create incident ticket.
2. Quickly assess impact (API health `/v1/health`, frontends basic checks).
3. Check logs and metrics (error spikes, DB connection errors, rate limit hits).
4. Identify recent deploys/changes; consider rollback if needed.
5. Communicate status and ETA to stakeholders.
6. Post-incident: root cause analysis (RCA), action items.

### Common runbooks
- API down:
  - Check process manager/container status; restart if crashed.
  - Validate `MONGODB_URI` availability; test connectivity with a simple script.
  - Inspect logs for fatal errors (schema changes, auth failures).
- MongoDB issues:
  - Check replica set status; failover health; disk/CPU.
  - Investigate long-running queries; indexes.
- Redis/queues delayed:
  - Inspect queue dashboards (bull-board/arena if enabled). Look for retry storms.
  - Scale workers or adjust backoff.
- High 5xx rates:
  - Check recent deployments; roll back or hotfix.
  - Examine upstream dependencies (payment/search).
- Elevated latency:
  - Review DB metrics and thread pool saturation.
  - Add caching, adjust query patterns, consider horizontal scaling.

## Security operations
- Secrets: rotate regularly; never log secrets.
- Webhooks: HMAC verification and idempotency keys (planned/partial).
- Bot/CAPTCHA: reCAPTCHA/hCaptcha integration (Phase 8).
- Audit logs: immutable chain (planned Phase 171).

## Known issues & gotchas
- Monorepo type errors may block full build; develop API in isolation if needed.
- Some tests rely on external services; use mocks and CI flags to skip heavy suites where appropriate.
- Ensure Playwright browsers are installed before E2E (`npx playwright install` or CI step already present).

## Contacts & escalation
- Primary on-call: <to-be-filled>
- Secondary on-call: <to-be-filled>
- Slack/Teams channel: <to-be-filled>
- Status page: <to-be-filled>

## Change management
- Pull requests with CI green.
- Feature flags or env toggles for risky changes.
- Staged rollouts when possible.

## Appendices
- Data retention policies (link or summary)
- Compliance requirements (GDPR/DPDP, tax/GST)
- Vendor payouts and finance runbooks (links)
