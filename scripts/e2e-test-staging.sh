#!/bin/bash

# E2E Tests for Staging Environment
# Updated to use staging ports and container names

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:5002/api}"
PASSED=0
FAILED=0

echo "═══════════════════════════════════════════════════════"
echo "      Los Ricos Tacos - E2E API Tests (Staging)"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Testing API: $API_URL"
echo ""

# Test 1: Health Endpoint
echo -n "[1/6] Health Endpoint... "
RESPONSE=$(curl -s "$API_URL/health")
if echo "$RESPONSE" | grep -q "ok\|healthy\|success"; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# Test 2: Menu Items
echo -n "[2/6] Menu Items Endpoint... "
RESPONSE=$(curl -s "$API_URL/menu/items")
if echo "$RESPONSE" | grep -q "Taco\|menu\|items"; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# Test 3: Menu Categories
echo -n "[3/6] Menu Categories Endpoint... "
RESPONSE=$(curl -s "$API_URL/menu/categories")
if echo "$RESPONSE" | grep -q "Tacos\|Burritos\|categories"; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# Test 4: Auth Register (should return 400 for invalid data)
echo -n "[4/6] Auth Register Endpoint... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"invalid"}')
if [ "$STATUS" = "400" ] || [ "$STATUS" = "422" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Validation working)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (Got status: $STATUS)"
    ((FAILED++))
fi

# Test 5: Auth Login (should return 401 for invalid credentials)
echo -n "[5/6] Auth Login Endpoint... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"nonexistent@test.com","password":"wrong"}')
if [ "$STATUS" = "401" ] || [ "$STATUS" = "400" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Auth working)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (Got status: $STATUS)"
    ((FAILED++))
fi

# Test 6: Database Connection
echo -n "[6/6] Database Connection... "
if docker exec staging_losricos_postgres psql -U staging_admin -d staging_losricos_tacos -c "SELECT 1" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════"
echo "                 TEST SUMMARY"
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}Passed: $PASSED/6${NC}"
echo -e "${RED}Failed: $FAILED/6${NC}"
SUCCESS_RATE=$((PASSED * 100 / 6))
echo "Success Rate: $SUCCESS_RATE%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          ✅ ALL TESTS PASSED                          ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║          ❌ TESTS FAILED - FIX REQUIRED               ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
