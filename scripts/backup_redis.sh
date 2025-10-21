#!/bin/bash
# Redis backup script
set -e
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/backups/redis"
mkdir -p "$BACKUP_DIR"
redis-cli SAVE
cp /data/dump.rdb "$BACKUP_DIR/dump-$DATE.rdb"
echo "Redis backup complete: $BACKUP_DIR/dump-$DATE.rdb"
