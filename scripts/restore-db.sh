#!/bin/bash

# Database Restore Script for Los Ricos Tacos
# Restores database from backup file

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <backup_file.sql>${NC}"
    echo -e "${YELLOW}Available backups:${NC}"
    ls -lh backups/*.sql 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}      Database Restore - Los Ricos Tacos${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}⚠️  WARNING: This will replace the current database!${NC}"
echo -e "Backup file: $BACKUP_FILE"
echo -n "Continue? (yes/no): "
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Restoring database...${NC}"

# Drop and recreate database
docker exec base2_postgres psql -U losricos_admin -d postgres -c "DROP DATABASE IF EXISTS losricos_tacos;"
docker exec base2_postgres psql -U losricos_admin -d postgres -c "CREATE DATABASE losricos_tacos;"

# Restore from backup
docker exec -i base2_postgres psql -U losricos_admin -d losricos_tacos < "$BACKUP_FILE"

echo ""
echo -e "${GREEN}✅ Database restored successfully${NC}"

# Verify restoration
echo ""
echo -e "${BLUE}Verifying restoration...${NC}"
TABLE_COUNT=$(docker exec base2_postgres psql -U losricos_admin -d losricos_tacos -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')
echo -e "   Tables restored: $TABLE_COUNT"

MENU_COUNT=$(docker exec base2_postgres psql -U losricos_admin -d losricos_tacos -t -c "SELECT COUNT(*) FROM menu_items;" | tr -d ' ')
echo -e "   Menu items: $MENU_COUNT"

echo -e "${GREEN}✅ Restoration verified${NC}"
