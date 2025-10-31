#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENVIRONMENT=${ENVIRONMENT:-production}
AWS_REGION=${AWS_REGION:-us-east-1}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SSL/TLS Certificate Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Install cert-manager if not already installed
echo -e "${YELLOW}Checking cert-manager installation...${NC}"
if ! kubectl get namespace cert-manager >/dev/null 2>&1; then
    echo "Installing cert-manager..."
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml
    kubectl wait --for=condition=Available --timeout=300s deployment/cert-manager -n cert-manager
    kubectl wait --for=condition=Available --timeout=300s deployment/cert-manager-webhook -n cert-manager
    echo -e "${GREEN}✓ cert-manager installed${NC}"
else
    echo -e "${GREEN}✓ cert-manager already installed${NC}"
fi
echo ""

# Create ClusterIssuer for Let's Encrypt
echo -e "${YELLOW}Creating ClusterIssuer...${NC}"
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@taskmanager.io
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
      - dns01:
          route53:
            region: $AWS_REGION
EOF
echo -e "${GREEN}✓ ClusterIssuer created${NC}"
echo ""

# Create staging ClusterIssuer
echo -e "${YELLOW}Creating staging ClusterIssuer...${NC}"
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@taskmanager.io
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
echo -e "${GREEN}✓ Staging ClusterIssuer created${NC}"
echo ""

# Create Certificate for main domain
echo -e "${YELLOW}Creating certificate for taskmanager.io...${NC}"
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: taskmanager-tls
  namespace: $ENVIRONMENT
spec:
  secretName: taskmanager-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - taskmanager.io
    - www.taskmanager.io
    - api.taskmanager.io
    - staging.taskmanager.io
    - staging-api.taskmanager.io
EOF
echo -e "${GREEN}✓ Certificate request created${NC}"
echo ""

# Wait for certificate to be ready
echo -e "${YELLOW}Waiting for certificate to be issued...${NC}"
kubectl wait --for=condition=Ready --timeout=300s certificate/taskmanager-tls -n $ENVIRONMENT
echo -e "${GREEN}✓ Certificate issued successfully${NC}"
echo ""

# Check certificate status
echo -e "${YELLOW}Certificate status:${NC}"
kubectl get certificate -n $ENVIRONMENT
kubectl describe certificate taskmanager-tls -n $ENVIRONMENT
echo ""

echo -e "${GREEN}SSL/TLS setup completed successfully!${NC}"
