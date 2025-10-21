#!/bin/bash
# Secure, append-only backup script for MongoDB
set -e
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR=/secure-backups/mongo
mkdir -p $BACKUP_DIR
mongodump --uri "$MONGODB_URI" --archive=$BACKUP_DIR/backup_$DATE.gz --gzip
chmod a-w $BACKUP_DIR/backup_$DATE.gz # Make backup file append-only
# Optionally sync to offsite/geo-replica
if [ "$GEO_REPLICA" = "true" ]; then
	rsync -avz $BACKUP_DIR/backup_$DATE.gz user@replica-host:/geo-backups/mongo/
fi
