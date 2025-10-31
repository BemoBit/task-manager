#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENVIRONMENT=${ENVIRONMENT:-production}
COMPONENT=${1:-all}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TaskManager Rollback Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Component: $COMPONENT"
echo ""

rollback_deployment() {
    local deployment=$1
    local namespace=$2
    
    echo -e "${YELLOW}Rolling back $deployment...${NC}"
    kubectl rollout undo deployment/$deployment -n $namespace
    kubectl rollout status deployment/$deployment -n $namespace
    echo -e "${GREEN}✓ $deployment rolled back${NC}"
}

case $COMPONENT in
    backend)
        rollback_deployment "backend-deployment" $ENVIRONMENT
        ;;
    frontend)
        rollback_deployment "frontend-deployment" $ENVIRONMENT
        ;;
    all)
        rollback_deployment "backend-deployment" $ENVIRONMENT
        rollback_deployment "frontend-deployment" $ENVIRONMENT
        ;;
    *)
        echo -e "${RED}Unknown component: $COMPONENT${NC}"
        echo "Usage: $0 [backend|frontend|all]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Rollback completed successfully!${NC}"
echo ""
echo "Current deployment status:"
kubectl get pods -n $ENVIRONMENT
