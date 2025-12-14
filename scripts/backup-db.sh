#!/bin/bash

# Database Backup Script for Los Ricos Tacos
# Creates timestamped backup of PostgreSQL database

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/losricos_tacos_$TIMESTAMP.sql"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}      Database Backup - Los Ricos Tacos${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}Creating backup...${NC}"
docker exec base2_postgres pg_dump -U losricos_admin losricos_tacos > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup created successfully${NC}"
    echo -e "   File: $BACKUP_FILE"
    echo -e "   Size: $SIZE"
    
    # Verify backup integrity
    echo ""
    echo -e "${BLUE}Verifying backup integrity...${NC}"
    if grep -q "PostgreSQL database dump complete" "$BACKUP_FILE"; then
        echo -e "${GREEN}✅ Backup integrity verified${NC}"
    else
        echo -e "${RED}❌ Backup may be incomplete${NC}"
        exit 1
    fi
    
    # Show backup contents summary
    echo ""
    echo -e "${BLUE}Backup Summary:${NC}"
    echo -e "   Tables: $(grep -c "CREATE TABLE" "$BACKUP_FILE")"
    echo -e "   Indexes: $(grep -c "CREATE INDEX" "$BACKUP_FILE")"
    echo -e "   Data Rows: $(grep -c "INSERT INTO" "$BACKUP_FILE")"
    
    exit 0
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi
