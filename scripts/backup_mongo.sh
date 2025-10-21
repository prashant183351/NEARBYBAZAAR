#!/bin/bash
# MongoDB backup script
set -e
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/backups/mongo"
mkdir -p "$BACKUP_DIR"
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$DATE"
echo "MongoDB backup complete: $BACKUP_DIR/$DATE"
