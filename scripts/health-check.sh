#!/bin/bash

# Comprehensive Health Check Script
# Validates all services and endpoints

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Health Check - Los Ricos Tacos              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check 1: Docker containers
echo -e "${BLUE}[1/8] Checking Docker containers...${NC}"
RUNNING=$(docker ps --filter "name=base2_" --format "{{.Names}}" | wc -l)
EXPECTED=6
if [ "$RUNNING" -ge "$EXPECTED" ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - $RUNNING/$EXPECTED containers running"
    ((PASSED++))
else
    echo -e "   ${RED}❌ FAIL${NC} - Only $RUNNING/$EXPECTED containers running"
    ((FAILED++))
fi

# Check 2: Container health
echo -e "${BLUE}[2/8] Checking container health...${NC}"
HEALTHY=$(docker ps --filter "name=base2_" --filter "health=healthy" | wc -l)
if [ "$HEALTHY" -ge 5 ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - $HEALTHY containers healthy"
    ((PASSED++))
else
    echo -e "   ${RED}❌ FAIL${NC} - Only $HEALTHY containers healthy"
    ((FAILED++))
fi

# Check 3: Backend API
echo -e "${BLUE}[3/8] Checking Backend API...${NC}"
if docker exec base2_nginx wget -q -O- http://backend:5001/api/health 2>/dev/null | grep -q "success"; then
    echo -e "   ${GREEN}✅ PASS${NC} - Backend API responding"
    ((PASSED++))
else
    echo -e "   ${RED}❌ FAIL${NC} - Backend API not responding"
    ((FAILED++))
fi

# Check 4: Database
echo -e "${BLUE}[4/8] Checking Database...${NC}"
if docker exec base2_postgres psql -U losricos_admin -d losricos_tacos -c "SELECT 1" >/dev/null 2>&1; then
    echo -e "   ${GREEN}✅ PASS${NC} - Database accessible"
    ((PASSED++))
else
    echo -e "   ${RED}❌ FAIL${NC} - Database not accessible"
    ((FAILED++))
fi

# Check 5: Database tables
echo -e "${BLUE}[5/8] Checking Database schema...${NC}"
TABLES=$(docker exec base2_postgres psql -U losricos_admin -d losricos_tacos -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
if [ "$TABLES" -ge 6 ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - $TABLES tables present"
    ((PASSED++))
else
    echo -e "   ${YELLOW}⚠️  WARN${NC} - Only $TABLES tables found"
    ((WARNINGS++))
    ((PASSED++))
fi

# Check 6: Disk space
echo -e "${BLUE}[6/8] Checking Disk space...${NC}"
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - Disk usage: ${DISK_USAGE}%"
    ((PASSED++))
else
    echo -e "   ${YELLOW}⚠️  WARN${NC} - Disk usage high: ${DISK_USAGE}%"
    ((WARNINGS++))
    ((PASSED++))
fi

# Check 7: Memory
echo -e "${BLUE}[7/8] Checking Memory usage...${NC}"
if command -v free >/dev/null 2>&1; then
    MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    if [ "$MEM_USAGE" -lt 90 ]; then
        echo -e "   ${GREEN}✅ PASS${NC} - Memory usage: ${MEM_USAGE}%"
        ((PASSED++))
    else
        echo -e "   ${YELLOW}⚠️  WARN${NC} - Memory usage high: ${MEM_USAGE}%"
        ((WARNINGS++))
        ((PASSED++))
    fi
else
    echo -e "   ${YELLOW}⚠️  SKIP${NC} - Memory check not available"
    ((PASSED++))
fi

# Check 8: SSL Certificate (if in production)
echo -e "${BLUE}[8/8] Checking SSL certificate...${NC}"
if [ -f "traefik/acme/acme.json" ]; then
    if [ -s "traefik/acme/acme.json" ]; then
        echo -e "   ${GREEN}✅ PASS${NC} - SSL certificate present"
        ((PASSED++))
    else
        echo -e "   ${YELLOW}⚠️  WARN${NC} - SSL certificate file empty"
        ((WARNINGS++))
        ((PASSED++))
    fi
else
    echo -e "   ${YELLOW}⚠️  SKIP${NC} - SSL not configured (development mode)"
    ((PASSED++))
fi

# Summary
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 HEALTH CHECK SUMMARY                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo -e "${GREEN}✅ Passed:   $PASSED/8${NC}"
echo -e "${RED}❌ Failed:   $FAILED/8${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"

SUCCESS_RATE=$((PASSED * 100 / 8))
echo -e "${BLUE}📊 Health Score: $SUCCESS_RATE%${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ SYSTEM HEALTHY${NC}"
    exit 0
else
    echo -e "${RED}❌ SYSTEM UNHEALTHY - ATTENTION REQUIRED${NC}"
    exit 1
fi
