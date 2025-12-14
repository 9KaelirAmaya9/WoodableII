#!/bin/bash

# Enhanced Load Testing - POST Endpoints
# Tests authentication and order creation under load

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}      Enhanced Load Testing - POST Endpoints${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

API_URL="http://localhost"
CONCURRENCY=50
REQUESTS=500

echo -e "${BLUE}Test Configuration:${NC}"
echo -e "  - Concurrent Users: $CONCURRENCY"
echo -e "  - Total Requests: $REQUESTS"
echo -e "  - Target: $API_URL"
echo ""

# Test 1: Register endpoint (POST)
echo -e "${BLUE}[1/3] Load Testing Register Endpoint (POST)...${NC}"
cat > /tmp/register_payload.json << 'EOF'
{"email":"loadtest@test.com","password":"Test123!","name":"Load Test"}
EOF

ab -n $REQUESTS -c $CONCURRENCY -p /tmp/register_payload.json -T application/json -q "$API_URL/api/auth/register" 2>&1 | grep -E "Requests per second|Time per request|Failed requests|Non-2xx responses" || true
echo ""

# Test 2: Login endpoint (POST)
echo -e "${BLUE}[2/3] Load Testing Login Endpoint (POST)...${NC}"
cat > /tmp/login_payload.json << 'EOF'
{"email":"test@test.com","password":"wrongpassword"}
EOF

ab -n $REQUESTS -c $CONCURRENCY -p /tmp/login_payload.json -T application/json -q "$API_URL/api/auth/login" 2>&1 | grep -E "Requests per second|Time per request|Failed requests|Non-2xx responses" || true
echo ""

# Test 3: High concurrency on menu endpoint
echo -e "${BLUE}[3/3] Stress Testing Menu Items (100 concurrent)...${NC}"
ab -n 1000 -c 100 -q "$API_URL/api/menu/items" 2>&1 | grep -E "Requests per second|Time per request|Failed requests|Percentage of the requests" || true
echo ""

# Cleanup
rm -f /tmp/register_payload.json /tmp/login_payload.json

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Enhanced Load Testing Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
