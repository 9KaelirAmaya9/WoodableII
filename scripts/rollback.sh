#!/bin/bash

# Rollback Script
# Reverts to previous deployment state

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

DEPLOY_DIR="/opt/apps/WoodableII"
BACKUP_DIR="/opt/backups"

echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║          ⚠️  ROLLBACK PROCEDURE                       ║${NC}"
echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# List available backups
echo -e "${BLUE}Available backups:${NC}"
ls -lh "$BACKUP_DIR"/*.sql 2>/dev/null || echo "No backups found"
echo ""

# Get latest backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}❌ No backup found to rollback to${NC}"
    exit 1
fi

echo -e "${YELLOW}Latest backup: $LATEST_BACKUP${NC}"
echo -e "${YELLOW}Created: $(stat -f %Sm "$LATEST_BACKUP")${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: This will:${NC}"
echo -e "${RED}   1. Stop all services${NC}"
echo -e "${RED}   2. Restore database from backup${NC}"
echo -e "${RED}   3. Restart services${NC}"
echo ""
read -p "Are you sure you want to rollback? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Rollback cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}[1/5] Stopping services...${NC}"
cd "$DEPLOY_DIR"
docker compose -f local.docker.yml down
echo -e "${GREEN}✅ Services stopped${NC}"

echo -e "${BLUE}[2/5] Starting database...${NC}"
docker compose -f local.docker.yml up -d postgres
sleep 10
echo -e "${GREEN}✅ Database started${NC}"

echo -e "${BLUE}[3/5] Restoring database from backup...${NC}"
docker exec base2_postgres psql -U losricos_admin -d postgres -c "DROP DATABASE IF EXISTS losricos_tacos;"
docker exec base2_postgres psql -U losricos_admin -d postgres -c "CREATE DATABASE losricos_tacos;"
docker exec -i base2_postgres psql -U losricos_admin -d losricos_tacos < "$LATEST_BACKUP"
echo -e "${GREEN}✅ Database restored${NC}"

echo -e "${BLUE}[4/5] Starting all services...${NC}"
docker compose -f local.docker.yml up -d
sleep 15
echo -e "${GREEN}✅ Services started${NC}"

echo -e "${BLUE}[5/5] Verifying rollback...${NC}"
HEALTHY=$(docker ps --filter "name=base2_" --filter "health=healthy" | wc -l)
if [ "$HEALTHY" -ge 5 ]; then
    echo -e "${GREEN}✅ Rollback successful - $HEALTHY services healthy${NC}"
else
    echo -e "${RED}⚠️  Warning: Only $HEALTHY services healthy${NC}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ ROLLBACK COMPLETE                         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Restored from: $LATEST_BACKUP${NC}"
echo -e "${YELLOW}Services running: $HEALTHY${NC}"
echo ""
