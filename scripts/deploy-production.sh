#!/bin/bash

# Production Deployment Script
# Los Ricos Tacos - Automated Production Deployment

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

DEPLOY_DIR="/opt/apps/WoodableII"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/losricos-deploy.log"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Los Ricos Tacos - Production Deployment          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Step 1: Pre-deployment backup
echo -e "${BLUE}[1/10] Creating pre-deployment backup...${NC}"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/pre-deploy-$(date +%Y%m%d_%H%M%S).sql"

if [ -d "$DEPLOY_DIR" ]; then
    cd "$DEPLOY_DIR"
    if docker ps | grep -q base2_postgres; then
        docker exec base2_postgres pg_dump -U losricos_admin losricos_tacos > "$BACKUP_FILE" 2>/dev/null || true
        log "✅ Backup created: $BACKUP_FILE"
    fi
else
    log "⚠️  No existing deployment found, skipping backup"
fi

# Step 2: Pull latest code
echo -e "${BLUE}[2/10] Pulling latest code from GitHub...${NC}"
if [ ! -d "$DEPLOY_DIR" ]; then
    log "Creating deployment directory..."
    mkdir -p "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    git clone https://github.com/9KaelirAmaya9/WoodableII.git .
else
    cd "$DEPLOY_DIR"
    git fetch origin
    git reset --hard origin/main
fi
log "✅ Code updated to latest version"

# Step 3: Verify .env exists
echo -e "${BLUE}[3/10] Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please create .env file with production values${NC}"
    exit 1
fi

# Verify critical env vars
REQUIRED_VARS=("JWT_SECRET" "POSTGRES_PASSWORD" "NODE_ENV")
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env; then
        echo -e "${RED}❌ Missing required variable: $var${NC}"
        exit 1
    fi
done
log "✅ Environment configuration verified"

# Step 4: Stop existing services
echo -e "${BLUE}[4/10] Stopping existing services...${NC}"
if docker ps | grep -q base2_; then
    docker compose -f local.docker.yml down
    log "✅ Services stopped"
else
    log "⚠️  No services running"
fi

# Step 5: Pull latest images
echo -e "${BLUE}[5/10] Pulling latest Docker images...${NC}"
docker compose -f local.docker.yml pull
log "✅ Images updated"

# Step 6: Build services
echo -e "${BLUE}[6/10] Building services...${NC}"
docker compose -f local.docker.yml build --no-cache
log "✅ Services built"

# Step 7: Start services
echo -e "${BLUE}[7/10] Starting services...${NC}"
docker compose -f local.docker.yml up -d
log "✅ Services started"

# Step 8: Wait for services to be healthy
echo -e "${BLUE}[8/10] Waiting for services to be healthy...${NC}"
sleep 10

MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    HEALTHY=$(docker ps --filter "name=base2_" --filter "health=healthy" | wc -l)
    if [ "$HEALTHY" -ge 5 ]; then
        log "✅ All services healthy"
        break
    fi
    echo -n "."
    sleep 2
    WAITED=$((WAITED + 2))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}❌ Services did not become healthy in time${NC}"
    log "❌ Deployment failed - services unhealthy"
    exit 1
fi

# Step 9: Run health checks
echo -e "${BLUE}[9/10] Running health checks...${NC}"
sleep 5

# Check backend health
if docker exec base2_nginx wget -q -O- http://backend:5001/api/health 2>/dev/null | grep -q "success"; then
    log "✅ Backend health check passed"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    log "❌ Deployment failed - backend unhealthy"
    exit 1
fi

# Check database
if docker exec base2_postgres psql -U losricos_admin -d losricos_tacos -c "SELECT 1" >/dev/null 2>&1; then
    log "✅ Database health check passed"
else
    echo -e "${RED}❌ Database health check failed${NC}"
    log "❌ Deployment failed - database unhealthy"
    exit 1
fi

# Step 10: Verify deployment
echo -e "${BLUE}[10/10] Verifying deployment...${NC}"
CONTAINERS=$(docker ps --filter "name=base2_" --format "{{.Names}}" | wc -l)
if [ "$CONTAINERS" -ge 5 ]; then
    log "✅ Deployment verified - $CONTAINERS containers running"
else
    echo -e "${RED}❌ Expected 5+ containers, found $CONTAINERS${NC}"
    log "❌ Deployment incomplete"
    exit 1
fi

# Success
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ DEPLOYMENT SUCCESSFUL                     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Deployment completed at: $(date)${NC}"
echo -e "${GREEN}Backup location: $BACKUP_FILE${NC}"
echo -e "${GREEN}Services running: $CONTAINERS${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Monitor logs: docker compose -f local.docker.yml logs -f"
echo -e "  2. Check health: curl https://losricostacos.com/api/health"
echo -e "  3. Test frontend: https://losricostacos.com"
echo ""

log "✅ Deployment completed successfully"
exit 0
