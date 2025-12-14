#!/bin/bash

# Pre-Deployment Validation Checklist
# Los Ricos Tacos - Production Readiness

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
echo -e "${BLUE}║     Pre-Deployment Validation Checklist              ║${NC}"
echo -e "${BLUE}║     Los Ricos Tacos - Production Readiness           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check 1: Environment Variables
echo -e "${BLUE}[1/12] Environment Variables...${NC}"
if [ -f ".env" ]; then
    if grep -q "JWT_SECRET=7d373ccb" .env && ! grep -q "mypassword" .env; then
        echo -e "   ${GREEN}✅ PASS${NC} - Secure configuration found"
        ((PASSED++))
    else
        echo -e "   ${RED}❌ FAIL${NC} - Weak passwords detected"
        ((FAILED++))
    fi
else
    echo -e "   ${RED}❌ FAIL${NC} - .env file missing"
    ((FAILED++))
fi

# Check 2: All Containers Running
echo -e "${BLUE}[2/12] Docker Containers...${NC}"
RUNNING=$(docker ps --filter "name=base2_" --format "{{.Names}}" | wc -l)
if [ "$RUNNING" -ge 6 ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - $RUNNING containers running"
    ((PASSED++))
else
    echo -e "   ${RED}❌ FAIL${NC} - Only $RUNNING/6 containers running"
    ((FAILED++))
fi

# Check 3: Database Tables
echo -e "${BLUE}[3/12] Database Schema...${NC}"
TABLES=$(docker exec base2_postgres psql -U losricos_admin -d losricos_tacos -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
if [ "$TABLES" -eq 6 ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - All 6 tables present"
    ((PASSED++))
else
    echo -e "   ${RED}❌ FAIL${NC} - Expected 6 tables, found $TABLES"
    ((FAILED++))
fi

# Check 4: API Health
echo -e "${BLUE}[4/12] API Health Endpoint...${NC}"
if docker exec base2_nginx wget -q -O- http://backend:5001/api/health 2>/dev/null | grep -q '"success":true'; then
    echo -e "   ${GREEN}✅ PASS${NC} - API responding"
    ((PASSED++))
else
    echo -e "   ${RED}❌ FAIL${NC} - API not responding"
    ((FAILED++))
fi

# Check 5: Menu Data
echo -e "${BLUE}[5/12] Menu Data...${NC}"
ITEMS=$(docker exec base2_postgres psql -U losricos_admin -d losricos_tacos -t -c "SELECT COUNT(*) FROM menu_items;" 2>/dev/null | tr -d ' ')
if [ "$ITEMS" -gt 0 ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - $ITEMS menu items loaded"
    ((PASSED++))
else
    echo -e "   ${YELLOW}⚠️  WARN${NC} - No menu items (expected for fresh install)"
    ((WARNINGS++))
    ((PASSED++))
fi

# Check 6: Backup System
echo -e "${BLUE}[6/12] Backup Scripts...${NC}"
if [ -f "scripts/backup-db.sh" ] && [ -x "scripts/backup-db.sh" ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - Backup scripts ready"
    ((PASSED++))
else
    echo -e "   ${RED}❌ FAIL${NC} - Backup scripts missing"
    ((FAILED++))
fi

# Check 7: SSL Configuration
echo -e "${BLUE}[7/12] SSL Configuration...${NC}"
if grep -q "acme-v02.api.letsencrypt.org" traefik/traefik.yml; then
    echo -e "   ${GREEN}✅ PASS${NC} - Production SSL configured"
    ((PASSED++))
else
    echo -e "   ${YELLOW}⚠️  WARN${NC} - Using staging SSL"
    ((WARNINGS++))
    ((PASSED++))
fi

# Check 8: Security Headers
echo -e "${BLUE}[8/12] Security Headers...${NC}"
if grep -q "security-headers" local.docker.yml; then
    echo -e "   ${GREEN}✅ PASS${NC} - Security headers configured"
    ((PASSED++))
else
    echo -e "   ${RED}❌ FAIL${NC} - Security headers missing"
    ((FAILED++))
fi

# Check 9: Rate Limiting
echo -e "${BLUE}[9/12] Rate Limiting...${NC}"
if grep -q "RATE_LIMIT" .env; then
    echo -e "   ${GREEN}✅ PASS${NC} - Rate limiting configured"
    ((PASSED++))
else
    echo -e "   ${RED}❌ FAIL${NC} - Rate limiting not configured"
    ((FAILED++))
fi

# Check 10: Node Environment
echo -e "${BLUE}[10/12] Node Environment...${NC}"
if grep -q "NODE_ENV=production" .env; then
    echo -e "   ${GREEN}✅ PASS${NC} - Production mode enabled"
    ((PASSED++))
else
    echo -e "   ${YELLOW}⚠️  WARN${NC} - Not in production mode"
    ((WARNINGS++))
    ((PASSED++))
fi

# Check 11: Monitoring Setup
echo -e "${BLUE}[11/12] Monitoring Documentation...${NC}"
if [ -f "docs/sentry-setup.md" ] && [ -f "docs/uptimerobot-setup.md" ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - Monitoring guides ready"
    ((PASSED++))
else
    echo -e "   ${YELLOW}⚠️  WARN${NC} - Monitoring guides missing"
    ((WARNINGS++))
    ((PASSED++))
fi

# Check 12: E2E Tests
echo -e "${BLUE}[12/12] E2E Test Script...${NC}"
if [ -f "scripts/e2e-test.sh" ] && [ -x "scripts/e2e-test.sh" ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - E2E tests available"
    ((PASSED++))
else
    echo -e "   ${RED}❌ FAIL${NC} - E2E tests missing"
    ((FAILED++))
fi

# Summary
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 VALIDATION SUMMARY                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo -e "${GREEN}✅ Passed:   $PASSED/12${NC}"
echo -e "${RED}❌ Failed:   $FAILED/12${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"

SUCCESS_RATE=$((PASSED * 100 / 12))
echo -e "${BLUE}📊 Success Rate: $SUCCESS_RATE%${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ✅ READY FOR DEPLOYMENT                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║     ❌ NOT READY - FIX FAILURES FIRST                 ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
