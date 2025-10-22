# Operations & Disaster Recovery

## Health Endpoints

- `/livez`: Liveness probe (returns OK if process is up)
- `/readyz`: Readiness probe (returns OK if DB is connected, 503 if not)

## Backups

- MongoDB: `scripts/backup_mongo.sh` (uses `mongodump`)
- Redis: `scripts/backup_redis.sh` (uses `redis-cli SAVE` and copies RDB)
- Schedule via cron or external scheduler
- Store backups in `/backups` (mount persistent volume in production)

## Recovery Objectives

- **RTO (Recovery Time Objective):** Target < 30 minutes (time to restore from backup)
- **RPO (Recovery Point Objective):** Target < 15 minutes (data loss window, based on backup frequency)

## Restore

- MongoDB: `mongorestore --uri=$MONGODB_URI /backups/mongo/<DATE>`
- Redis: Stop Redis, replace `dump.rdb` with backup, restart Redis

## Testing

- Test `/readyz` by stopping MongoDB and confirming 503 is returned
- Test backup/restore scripts in dev before production use

## Notes

- Monitor backup success and alert on failures
- Encrypt backups if storing offsite
