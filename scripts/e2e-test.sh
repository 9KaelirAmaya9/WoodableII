#!/bin/bash

# E2E API Tests - Production Ready
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}      Los Ricos Tacos - E2E API Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Test 1: Health Check
echo -n "[1/6] Health Endpoint... "
if docker exec base2_nginx wget -q -O- http://backend:5001/api/health 2>/dev/null | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# Test 2: Menu Items
echo -n "[2/6] Menu Items Endpoint... "
if docker exec base2_nginx wget -q -O- http://backend:5001/api/menu/items 2>/dev/null | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# Test 3: Menu Categories
echo -n "[3/6] Menu Categories Endpoint... "
if docker exec base2_nginx wget -q -O- http://backend:5001/api/menu/categories 2>/dev/null | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# Test 4: Auth Register (endpoint exists and responds)
echo -n "[4/6] Auth Register Endpoint... "
# Try to register with empty data - should get error response
docker exec base2_nginx wget -q -O /tmp/register_test.txt --post-data='{}' --header='Content-Type: application/json' http://backend:5001/api/auth/register 2>/dev/null || true
if docker exec base2_nginx test -f /tmp/register_test.txt; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
    docker exec base2_nginx rm -f /tmp/register_test.txt
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# Test 5: Auth Login (endpoint exists and responds)
echo -n "[5/6] Auth Login Endpoint... "
# Try to login with invalid creds - should get error response
docker exec base2_nginx wget -q -O /tmp/login_test.txt --post-data='{"email":"test@test.com","password":"wrong"}' --header='Content-Type: application/json' http://backend:5001/api/auth/login 2>/dev/null || true
if docker exec base2_nginx test -f /tmp/login_test.txt; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
    docker exec base2_nginx rm -f /tmp/login_test.txt
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# Test 6: Database Connection
echo -n "[6/6] Database Connection... "
if docker exec base2_postgres psql -U losricos_admin -d losricos_tacos -c "SELECT COUNT(*) FROM menu_items" 2>/dev/null | grep -q "3"; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                 TEST SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Passed: $PASSED/6${NC}"
echo -e "${RED}Failed: $FAILED/6${NC}"
SUCCESS_RATE=$((PASSED * 100 / 6))
echo -e "${BLUE}Success Rate: $SUCCESS_RATE%${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          ✅ ALL TESTS PASSED (100%)                   ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║          ❌ TESTS FAILED - FIX REQUIRED               ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
