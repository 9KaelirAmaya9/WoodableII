#!/bin/bash
# Clean up backups older than retention period
BACKUP_DIR="$(dirname "$0")/../backups"
RETENTION_DAYS=7

find "$BACKUP_DIR" -name "*.sql" -type f -mtime +$RETENTION_DAYS -delete
echo "Cleaned up backups older than $RETENTION_DAYS days"
