#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENVIRONMENT=${ENVIRONMENT:-staging}
BACKUP_FILE=${BACKUP_FILE:-}

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: BACKUP_FILE environment variable must be set${NC}"
    echo "Usage: BACKUP_FILE=backup-20231201-120000.sql.gz ENVIRONMENT=staging ./scripts/restore.sh"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TaskManager Restore Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Backup File: $BACKUP_FILE"
echo ""

echo -e "${YELLOW}WARNING: This will restore the database from backup!${NC}"
echo -e "${YELLOW}All current data will be replaced!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy]es$ ]]
then
    echo "Restore cancelled"
    exit 1
fi

# Run restore playbook
echo -e "${YELLOW}Running restore playbook...${NC}"
cd ansible
export ENVIRONMENT=$ENVIRONMENT
export BACKUP_FILE=$BACKUP_FILE
ansible-playbook restore.yml
echo -e "${GREEN}✓ Restore completed${NC}"
echo ""

echo -e "${GREEN}Restore process completed successfully!${NC}"
