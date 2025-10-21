#!/bin/bash
# Restore MongoDB from secure backup
set -e
if [ -z "$1" ]; then
	echo "Usage: $0 <backup_file>"
	exit 1
fi
mongorestore --uri "$MONGODB_URI" --gzip --archive=$1
