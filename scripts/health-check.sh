#!/bin/bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENVIRONMENT=${ENVIRONMENT:-production}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TaskManager Health Check${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Environment: $ENVIRONMENT"
echo ""

# Check cluster health
echo -e "${YELLOW}Checking cluster health...${NC}"
kubectl cluster-info
echo ""

# Check nodes
echo -e "${YELLOW}Node status:${NC}"
kubectl get nodes
echo ""

# Check pods
echo -e "${YELLOW}Pod status (${ENVIRONMENT}):${NC}"
kubectl get pods -n $ENVIRONMENT
echo ""

# Check services
echo -e "${YELLOW}Service status (${ENVIRONMENT}):${NC}"
kubectl get svc -n $ENVIRONMENT
echo ""

# Check HPA
echo -e "${YELLOW}HPA status (${ENVIRONMENT}):${NC}"
kubectl get hpa -n $ENVIRONMENT
echo ""

# Check ingress
echo -e "${YELLOW}Ingress status:${NC}"
kubectl get ingress -A
echo ""

# Check monitoring
echo -e "${YELLOW}Monitoring pods:${NC}"
kubectl get pods -n monitoring
echo ""

# Test endpoints
echo -e "${YELLOW}Testing endpoints...${NC}"
echo "Backend health:"
kubectl run curl-test --image=curlimages/curl:latest --rm -i --restart=Never -- \
  curl -s http://backend-service.$ENVIRONMENT:3001/health || echo "Failed"
echo ""

echo "Frontend health:"
kubectl run curl-test --image=curlimages/curl:latest --rm -i --restart=Never -- \
  curl -s http://frontend-service.$ENVIRONMENT:3000/api/health || echo "Failed"
echo ""

# Check logs for errors
echo -e "${YELLOW}Recent errors in logs:${NC}"
kubectl logs -n $ENVIRONMENT -l app=backend --tail=50 | grep -i error || echo "No errors found"
echo ""

# Check resource usage
echo -e "${YELLOW}Resource usage:${NC}"
kubectl top nodes
echo ""
kubectl top pods -n $ENVIRONMENT
echo ""

echo -e "${GREEN}Health check completed!${NC}"
