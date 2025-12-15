#!/bin/bash

# Local Staging Environment Setup
# Creates a complete staging environment on local machine

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Local Staging Environment Setup                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check if .env.staging exists
echo -e "${BLUE}[1/6] Checking staging configuration...${NC}"
if [ ! -f ".env.staging" ]; then
    echo -e "${RED}❌ .env.staging not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Staging configuration found${NC}"

# Step 2: Stop production if running
echo -e "${BLUE}[2/6] Stopping production services (if running)...${NC}"
if docker ps | grep -q "base2_"; then
    echo -e "${YELLOW}⚠️  Production services detected, stopping...${NC}"
    docker compose -f local.docker.yml down
fi
echo -e "${GREEN}✅ Ready for staging${NC}"

# Step 3: Copy staging env
echo -e "${BLUE}[3/6] Activating staging environment...${NC}"
cp .env .env.production.backup 2>/dev/null || true
cp .env.staging .env
echo -e "${GREEN}✅ Staging environment activated${NC}"

# Step 4: Start staging services
echo -e "${BLUE}[4/6] Starting staging services...${NC}"
docker compose -f local.docker.yml up -d --build
echo -e "${GREEN}✅ Services starting...${NC}"

# Step 5: Wait for health
echo -e "${BLUE}[5/6] Waiting for services to be healthy...${NC}"
sleep 15

MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    HEALTHY=$(docker ps --filter "name=staging_losricos" --filter "health=healthy" 2>/dev/null | wc -l)
    if [ "$HEALTHY" -ge 4 ]; then
        break
    fi
    echo -n "."
    sleep 2
    WAITED=$((WAITED + 2))
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}❌ Services did not become healthy${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Services healthy${NC}"

# Step 6: Run health check
echo -e "${BLUE}[6/6] Running health checks...${NC}"
./scripts/health-check.sh

# Success
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ STAGING ENVIRONMENT READY                      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Staging URLs:${NC}"
echo -e "  Frontend:  http://localhost:8081"
echo -e "  Backend:   http://localhost:5002/api/health"
echo -e "  pgAdmin:   http://localhost:5051"
echo ""
echo -e "${YELLOW}To run tests:${NC}"
echo -e "  export API_URL=http://localhost:5002/api"
echo -e "  ./scripts/e2e-test.sh"
echo ""
echo -e "${YELLOW}To stop staging:${NC}"
echo -e "  docker compose -f local.docker.yml down"
echo -e "  cp .env.production.backup .env  # Restore production env"
echo ""
