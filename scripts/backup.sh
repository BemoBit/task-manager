#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENVIRONMENT=${ENVIRONMENT:-production}
BACKUP_BUCKET="taskmanager-$ENVIRONMENT-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TaskManager Backup Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $TIMESTAMP"
echo ""

# Backup using Ansible
echo -e "${YELLOW}Running backup playbook...${NC}"
cd ansible
export ENVIRONMENT=$ENVIRONMENT
ansible-playbook backup.yml
echo -e "${GREEN}✓ Backup completed${NC}"
echo ""

# Verify backups
echo -e "${YELLOW}Verifying backups...${NC}"
echo "PostgreSQL backups:"
aws s3 ls s3://$BACKUP_BUCKET/postgresql/ | tail -5
echo ""
echo "Redis backups:"
aws s3 ls s3://$BACKUP_BUCKET/redis/ | tail -5
echo ""

echo -e "${GREEN}Backup process completed successfully!${NC}"
echo "Backup location: s3://$BACKUP_BUCKET/"
