#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${ENVIRONMENT:-production}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="taskmanager"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TaskManager Infrastructure Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
command -v terraform >/dev/null 2>&1 || { echo -e "${RED}terraform is required but not installed.${NC}" >&2; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}kubectl is required but not installed.${NC}" >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo -e "${RED}aws CLI is required but not installed.${NC}" >&2; exit 1; }
command -v ansible >/dev/null 2>&1 || { echo -e "${RED}ansible is required but not installed.${NC}" >&2; exit 1; }
echo -e "${GREEN}✓ All prerequisites are installed${NC}"
echo ""

# Initialize Terraform
echo -e "${YELLOW}Initializing Terraform...${NC}"
cd terraform
terraform init
echo -e "${GREEN}✓ Terraform initialized${NC}"
echo ""

# Plan infrastructure
echo -e "${YELLOW}Planning infrastructure changes...${NC}"
terraform plan -var="environment=$ENVIRONMENT" -out=tfplan
echo ""

# Ask for confirmation
read -p "Do you want to apply these changes? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy]es$ ]]
then
    echo "Deployment cancelled"
    exit 1
fi

# Apply infrastructure
echo -e "${YELLOW}Applying infrastructure changes...${NC}"
terraform apply tfplan
echo -e "${GREEN}✓ Infrastructure deployed${NC}"
echo ""

# Get outputs
echo -e "${YELLOW}Retrieving infrastructure outputs...${NC}"
CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
REDIS_ENDPOINT=$(terraform output -raw redis_endpoint)
echo -e "${GREEN}✓ Outputs retrieved${NC}"
echo ""

# Configure kubectl
echo -e "${YELLOW}Configuring kubectl...${NC}"
aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME
echo -e "${GREEN}✓ kubectl configured${NC}"
echo ""

# Setup cluster with Ansible
echo -e "${YELLOW}Setting up Kubernetes cluster...${NC}"
cd ../ansible
export CLUSTER_NAME=$CLUSTER_NAME
export AWS_REGION=$AWS_REGION
ansible-playbook setup-cluster.yml
echo -e "${GREEN}✓ Cluster setup complete${NC}"
echo ""

# Deploy monitoring stack
echo -e "${YELLOW}Deploying monitoring stack...${NC}"
kubectl apply -f ../k8s/monitoring/
echo -e "${GREEN}✓ Monitoring stack deployed${NC}"
echo ""

# Deploy application
echo -e "${YELLOW}Deploying application...${NC}"
export ENVIRONMENT=$ENVIRONMENT
export IMAGE_TAG=${IMAGE_TAG:-latest}
ansible-playbook deploy-app.yml
echo -e "${GREEN}✓ Application deployed${NC}"
echo ""

# Setup secrets
echo -e "${YELLOW}Setting up secrets from AWS Secrets Manager...${NC}"
DB_SECRET=$(aws secretsmanager get-secret-value --secret-id $PROJECT_NAME-$ENVIRONMENT-db-credentials --query SecretString --output text)
REDIS_SECRET=$(aws secretsmanager get-secret-value --secret-id $PROJECT_NAME-$ENVIRONMENT-redis-credentials --query SecretString --output text)

DB_PASSWORD=$(echo $DB_SECRET | jq -r '.password')
REDIS_PASSWORD=$(echo $REDIS_SECRET | jq -r '.password')

kubectl create secret generic backend-secrets \
  --from-literal=database-url="postgresql://admin:$DB_PASSWORD@$RDS_ENDPOINT:5432/$PROJECT_NAME" \
  --from-literal=redis-password="$REDIS_PASSWORD" \
  --from-literal=jwt-secret=$(openssl rand -base64 32) \
  --from-literal=jwt-refresh-secret=$(openssl rand -base64 32) \
  --namespace=$ENVIRONMENT \
  --dry-run=client -o yaml | kubectl apply -f -

echo -e "${GREEN}✓ Secrets configured${NC}"
echo ""

# Print access information
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access URLs:"
echo "  Application: https://$ENVIRONMENT.taskmanager.io"
echo "  API: https://$ENVIRONMENT-api.taskmanager.io"
echo "  Grafana: https://grafana.taskmanager.io"
echo "  Prometheus: https://prometheus.taskmanager.io"
echo "  Kibana: https://kibana.taskmanager.io"
echo "  Jaeger: https://jaeger.taskmanager.io"
echo ""
echo "Cluster Information:"
echo "  Cluster Name: $CLUSTER_NAME"
echo "  Region: $AWS_REGION"
echo ""
echo "To view pods:"
echo "  kubectl get pods -n $ENVIRONMENT"
echo ""
echo "To view logs:"
echo "  kubectl logs -f deployment/backend-deployment -n $ENVIRONMENT"
echo ""
