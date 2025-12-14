#!/bin/bash

# Automated Backup Scheduling Script
# Sets up daily backups with retention policy

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-db.sh"
BACKUP_DIR="$SCRIPT_DIR/../backups"
RETENTION_DAYS=7

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}      Automated Backup Scheduling Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Create cleanup script
CLEANUP_SCRIPT="$SCRIPT_DIR/cleanup-old-backups.sh"
cat > "$CLEANUP_SCRIPT" << 'EOF'
#!/bin/bash
# Clean up backups older than retention period
BACKUP_DIR="$(dirname "$0")/../backups"
RETENTION_DAYS=7

find "$BACKUP_DIR" -name "*.sql" -type f -mtime +$RETENTION_DAYS -delete
echo "Cleaned up backups older than $RETENTION_DAYS days"
EOF

chmod +x "$CLEANUP_SCRIPT"

echo -e "${GREEN}✅ Created cleanup script${NC}"
echo ""

# Create cron job entry
CRON_ENTRY="0 2 * * * cd $(dirname $BACKUP_SCRIPT) && $BACKUP_SCRIPT && $CLEANUP_SCRIPT"

echo -e "${BLUE}Cron Job Configuration:${NC}"
echo -e "   Schedule: Daily at 2:00 AM"
echo -e "   Retention: $RETENTION_DAYS days"
echo -e "   Backup Dir: $BACKUP_DIR"
echo ""

echo -e "${YELLOW}To install cron job, run:${NC}"
echo -e "   (crontab -l 2>/dev/null; echo \"$CRON_ENTRY\") | crontab -"
echo ""

echo -e "${YELLOW}Or for systemd timer (recommended for production):${NC}"
echo -e "   1. Create /etc/systemd/system/losricos-backup.service"
echo -e "   2. Create /etc/systemd/system/losricos-backup.timer"
echo -e "   3. Run: systemctl enable --now losricos-backup.timer"
echo ""

# Create systemd service file template
cat > "$SCRIPT_DIR/../systemd-backup.service.template" << EOF
[Unit]
Description=Los Ricos Tacos Database Backup
After=docker.service

[Service]
Type=oneshot
WorkingDirectory=$(dirname $BACKUP_SCRIPT)
ExecStart=$BACKUP_SCRIPT
ExecStartPost=$CLEANUP_SCRIPT
User=$(whoami)

[Install]
WantedBy=multi-user.target
EOF

# Create systemd timer file template
cat > "$SCRIPT_DIR/../systemd-backup.timer.template" << EOF
[Unit]
Description=Daily backup timer for Los Ricos Tacos database

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

echo -e "${GREEN}✅ Created systemd templates${NC}"
echo -e "   - systemd-backup.service.template"
echo -e "   - systemd-backup.timer.template"
echo ""
echo -e "${GREEN}✅ Backup scheduling configured${NC}"
