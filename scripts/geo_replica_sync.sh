#!/bin/bash
# Manual geo-replication sync for MongoDB backups
set -e
BACKUP_DIR=/secure-backups/mongo
REPLICA_DIR=user@replica-host:/geo-backups/mongo/
rsync -avz $BACKUP_DIR/ $REPLICA_DIR
