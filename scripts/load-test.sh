#!/bin/bash

# Load Testing Script for Los Ricos Tacos API
# Uses Apache Bench (ab) to test API endpoints

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}      Los Ricos Tacos - Load Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check if ab is installed
if ! command -v ab &> /dev/null; then
    echo -e "${RED}❌ Apache Bench (ab) not installed${NC}"
    echo -e "${YELLOW}Install with: brew install httpd (macOS)${NC}"
    exit 1
fi

API_URL="http://localhost"
CONCURRENCY=10
REQUESTS=100

echo -e "${BLUE}Test Configuration:${NC}"
echo -e "  - Concurrent Users: $CONCURRENCY"
echo -e "  - Total Requests: $REQUESTS"
echo -e "  - Target: $API_URL"
echo ""

# Test 1: Health Endpoint
echo -e "${BLUE}[1/3] Load Testing Health Endpoint...${NC}"
ab -n $REQUESTS -c $CONCURRENCY -q "$API_URL/api/health" 2>&1 | grep -E "Requests per second|Time per request|Failed requests" || true
echo ""

# Test 2: Menu Items Endpoint  
echo -e "${BLUE}[2/3] Load Testing Menu Items Endpoint...${NC}"
ab -n $REQUESTS -c $CONCURRENCY -q "$API_URL/api/menu/items" 2>&1 | grep -E "Requests per second|Time per request|Failed requests" || true
echo ""

# Test 3: Menu Categories Endpoint
echo -e "${BLUE}[3/3] Load Testing Menu Categories Endpoint...${NC}"
ab -n $REQUESTS -c $CONCURRENCY -q "$API_URL/api/menu/categories" 2>&1 | grep -E "Requests per second|Time per request|Failed requests" || true
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Load Testing Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Note: For production, run with higher values:${NC}"
echo -e "  ./scripts/load-test.sh 50 1000  # 50 concurrent, 1000 requests"
