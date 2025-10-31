# 🚀 DevOps & Deployment Guide

Complete guide for deploying and managing the TaskManager application in production.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Infrastructure Setup](#infrastructure-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring & Observability](#monitoring--observability)
- [Backup & Restore](#backup--restore)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The TaskManager deployment infrastructure includes:

- **CI/CD**: GitHub Actions for automated testing, building, and deployment
- **Infrastructure as Code**: Terraform for AWS resources (VPC, EKS, RDS, ElastiCache)
- **Configuration Management**: Ansible for cluster setup and application deployment
- **Container Orchestration**: Kubernetes (EKS) with auto-scaling
- **Monitoring**: Prometheus, Grafana, ELK Stack, Jaeger
- **Security**: Network policies, RBAC, secrets management, SSL/TLS

## 🔧 Prerequisites

### Required Tools

```bash
# Install required tools
brew install terraform
brew install kubectl
brew install ansible
brew install awscli
brew install helm
```

### AWS Account Setup

1. **Create AWS Account** with appropriate permissions
2. **Configure AWS CLI**:
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter default region (e.g., us-east-1)
```

3. **Create S3 bucket for Terraform state**:
```bash
aws s3 mb s3://taskmanager-terraform-state
aws s3api put-bucket-versioning \
  --bucket taskmanager-terraform-state \
  --versioning-configuration Status=Enabled
```

4. **Create DynamoDB table for state locking**:
```bash
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets):

```bash
# Container Registry
GITHUB_TOKEN (automatically available)

# AWS Credentials
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

# Kubernetes
KUBE_CONFIG_STAGING
KUBE_CONFIG_PRODUCTION

# Database
STAGING_DATABASE_URL
PRODUCTION_DATABASE_URL
STAGING_REDIS_PASSWORD
PRODUCTION_REDIS_PASSWORD

# Security
STAGING_JWT_SECRET
PRODUCTION_JWT_SECRET
STAGING_JWT_REFRESH_SECRET
PRODUCTION_JWT_REFRESH_SECRET

# Monitoring
SNYK_TOKEN
CODECOV_TOKEN
SLACK_WEBHOOK

# CDN
STAGING_CDN_DISTRIBUTION_ID
PRODUCTION_CDN_DISTRIBUTION_ID
```

## 🏗️ Infrastructure Setup

### Step 1: Configure Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

**Key variables**:
```hcl
environment         = "production"
aws_region         = "us-east-1"
domain_name        = "taskmanager.io"
db_instance_class  = "db.r6g.xlarge"
redis_node_type    = "cache.r6g.large"
```

### Step 2: Deploy Infrastructure

```bash
# Use the automated deployment script
ENVIRONMENT=production ./scripts/deploy-infrastructure.sh
```

Or manually:

```bash
cd terraform

# Initialize Terraform
terraform init

# Plan changes
terraform plan -var="environment=production"

# Apply changes
terraform apply -var="environment=production"

# Get outputs
terraform output
```

### Step 3: Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name taskmanager-production

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### Step 4: Setup Kubernetes Cluster

```bash
cd ansible

# Run cluster setup playbook
export CLUSTER_NAME="taskmanager-production"
export AWS_REGION="us-east-1"
ansible-playbook setup-cluster.yml
```

This will install:
- NGINX Ingress Controller
- cert-manager for SSL/TLS
- Metrics Server
- External Secrets Operator
- AWS Load Balancer Controller

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

#### Backend CI/CD (`.github/workflows/backend-ci.yml`)

**Triggers**:
- Push to `main`, `develop`, `staging` branches
- Pull requests to `main`, `develop`

**Jobs**:
1. **Test**: Unit tests, E2E tests, coverage reporting
2. **Security**: Snyk scan, npm audit, OWASP dependency check
3. **Build**: Docker image build and push to GHCR
4. **Deploy Staging**: Auto-deploy to staging on `develop` branch
5. **Deploy Production**: Blue-green deployment on `main` branch

#### Frontend CI/CD (`.github/workflows/frontend-ci.yml`)

**Triggers**: Same as backend

**Jobs**:
1. **Test**: Lint, type check, tests
2. **Lighthouse**: Performance audit on PRs
3. **Security**: Vulnerability scanning
4. **Build**: Next.js production build
5. **Deploy**: Kubernetes deployment + CDN invalidation

### Manual Deployment

```bash
# Build and push images
docker build -t ghcr.io/bemobit/task-manager/backend:v1.0.0 ./backend
docker push ghcr.io/bemobit/task-manager/backend:v1.0.0

# Deploy with Ansible
cd ansible
export ENVIRONMENT=production
export IMAGE_TAG=v1.0.0
ansible-playbook deploy-app.yml
```

## ☸️ Kubernetes Deployment

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              NGINX Ingress Controller                    │
│  (SSL/TLS Termination, Rate Limiting, CORS)             │
└─────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
  ┌──────────────────┐        ┌──────────────────┐
  │   Frontend Pods  │        │   Backend Pods   │
  │   (Next.js)      │        │   (NestJS)       │
  │   Replicas: 3-10 │        │   Replicas: 3-10 │
  └──────────────────┘        └──────────────────┘
                                       │
                    ┌──────────────────┴─────────────┐
                    ▼                                 ▼
          ┌──────────────────┐            ┌──────────────────┐
          │   PostgreSQL     │            │     Redis        │
          │   (RDS)          │            │  (ElastiCache)   │
          └──────────────────┘            └──────────────────┘
```

### Deployment Manifests

Located in `k8s/`:
- `base/`: Base Kubernetes resources
- `overlays/staging/`: Staging environment overrides
- `overlays/production/`: Production environment overrides
- `monitoring/`: Observability stack

### Deploy to Kubernetes

```bash
# Using Kustomize
kubectl apply -k k8s/overlays/production

# Or using kubectl
kubectl apply -f k8s/base/
```

### Scaling

**Manual Scaling**:
```bash
kubectl scale deployment backend-deployment --replicas=10 -n production
```

**Auto-Scaling** (HPA already configured):
- CPU threshold: 70%
- Memory threshold: 80%
- Min replicas: 3 (staging: 2)
- Max replicas: 10 (production: 20)

### Updating Application

```bash
# Rolling update
kubectl set image deployment/backend-deployment \
  backend=ghcr.io/bemobit/task-manager/backend:v1.1.0 \
  -n production

# Watch rollout
kubectl rollout status deployment/backend-deployment -n production

# Rollback if needed
./scripts/rollback.sh backend
```

## 📊 Monitoring & Observability

### Access Monitoring Tools

```bash
# Port-forward for local access
kubectl port-forward -n monitoring svc/grafana 3000:3000
kubectl port-forward -n monitoring svc/prometheus 9090:9090
kubectl port-forward -n monitoring svc/kibana 5601:5601
kubectl port-forward -n monitoring svc/jaeger-query 16686:16686
```

Or access via domains (requires DNS setup):
- Grafana: https://grafana.taskmanager.io
- Prometheus: https://prometheus.taskmanager.io
- Kibana: https://kibana.taskmanager.io
- Jaeger: https://jaeger.taskmanager.io

### Prometheus Metrics

**Key Metrics**:
- `http_requests_total`: HTTP request count
- `http_request_duration_seconds`: Request latency
- `container_memory_usage_bytes`: Memory usage
- `container_cpu_usage_seconds_total`: CPU usage

**Custom Alerts**:
- High error rate (>5% 5xx responses)
- High memory usage (>90%)
- High CPU usage (>80%)
- Pod crash looping
- Deployment replicas mismatch

### Grafana Dashboards

Pre-configured dashboards:
1. **Application Overview**: Request rate, errors, latency
2. **Infrastructure**: CPU, memory, network, disk
3. **Database**: Connections, queries, performance
4. **Redis**: Hit rate, memory, connections

### ELK Stack (Logs)

**Query Examples**:
```
# Find errors in backend
kubernetes.pod.name:backend-* AND level:error

# Find slow queries
kubernetes.pod.name:backend-* AND message:"Query took"

# Find authentication failures
kubernetes.pod.name:backend-* AND message:"Authentication failed"
```

### Jaeger (Tracing)

View distributed traces for:
- API requests
- Database queries
- Cache operations
- External API calls

## 💾 Backup & Restore

### Automated Backups

**Schedule** (configured in production):
- Database: Daily snapshots, 30-day retention
- Redis: Daily backups to S3
- Application data: Continuous S3 sync

**Manual Backup**:
```bash
ENVIRONMENT=production ./scripts/backup.sh
```

### Restore from Backup

```bash
# List available backups
aws s3 ls s3://taskmanager-production-backups/postgresql/

# Restore specific backup
ENVIRONMENT=production \
BACKUP_FILE=backup-20231201-120000.sql.gz \
./scripts/restore.sh
```

### Disaster Recovery

1. **RDS Snapshot Restore**:
```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier taskmanager-production-new \
  --db-snapshot-identifier taskmanager-production-20231201
```

2. **Update connection strings** in secrets
3. **Run database migrations**:
```bash
kubectl run migration --image=ghcr.io/bemobit/task-manager/backend:latest \
  --restart=Never --env="DATABASE_URL=$NEW_DB_URL" \
  -- npx prisma migrate deploy
```

## 🔒 Security Best Practices

### Network Security

- **Network Policies**: Restrict pod-to-pod communication
- **Security Groups**: Control ingress/egress at AWS level
- **Private Subnets**: Database and cache in private subnets
- **VPC Flow Logs**: Monitor network traffic

### Application Security

- **Secrets Management**: AWS Secrets Manager + External Secrets Operator
- **RBAC**: Least privilege access for service accounts
- **Pod Security**: Non-root containers, read-only filesystems
- **Image Scanning**: Trivy scans in CI/CD
- **Dependency Scanning**: Snyk checks for vulnerabilities

### SSL/TLS

```bash
# Setup SSL certificates
./scripts/setup-ssl.sh
```

**Features**:
- Let's Encrypt certificates via cert-manager
- Automatic renewal
- TLS 1.2+ only
- HSTS headers

### Secrets Rotation

```bash
# Rotate JWT secrets
kubectl create secret generic backend-secrets \
  --from-literal=jwt-secret=$(openssl rand -base64 32) \
  --from-literal=jwt-refresh-secret=$(openssl rand -base64 32) \
  --namespace=production \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to pick up new secrets
kubectl rollout restart deployment/backend-deployment -n production
```

## 🔍 Troubleshooting

### Health Checks

```bash
# Run comprehensive health check
./scripts/health-check.sh
```

### Common Issues

#### Pods not starting

```bash
# Check pod status
kubectl get pods -n production

# View pod events
kubectl describe pod <pod-name> -n production

# Check logs
kubectl logs <pod-name> -n production

# Check previous logs if pod restarted
kubectl logs <pod-name> -n production --previous
```

#### Database connection issues

```bash
# Test database connectivity
kubectl run psql-test --image=postgres:15-alpine --rm -it --restart=Never \
  --env="PGPASSWORD=<password>" \
  -- psql -h <rds-endpoint> -U admin -d taskmanager
```

#### High latency

```bash
# Check HPA status
kubectl get hpa -n production

# View metrics
kubectl top pods -n production
kubectl top nodes

# Check for resource constraints
kubectl describe node <node-name>
```

#### Certificate issues

```bash
# Check certificate status
kubectl get certificate -n production
kubectl describe certificate taskmanager-tls -n production

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager
```

### Useful Commands

```bash
# View all resources in namespace
kubectl get all -n production

# Check resource usage
kubectl top pods -n production
kubectl top nodes

# View events
kubectl get events -n production --sort-by='.lastTimestamp'

# Execute command in pod
kubectl exec -it <pod-name> -n production -- /bin/sh

# Copy files from pod
kubectl cp production/<pod-name>:/app/logs/error.log ./error.log

# Port forward for debugging
kubectl port-forward <pod-name> 3001:3001 -n production

# View logs from multiple pods
kubectl logs -l app=backend -n production --tail=100 -f
```

### Performance Tuning

**Database**:
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC LIMIT 10;

-- Check connection count
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('taskmanager'));
```

**Redis**:
```bash
# Connect to Redis
redis-cli -h <redis-endpoint> -a <password>

# Check memory usage
INFO memory

# Check hit rate
INFO stats

# Monitor commands
MONITOR
```

## 📞 Support & Resources

### Documentation
- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Ansible Docs](https://docs.ansible.com/)
- [GitHub Actions](https://docs.github.com/en/actions)

### Monitoring Dashboards
- Grafana: https://grafana.taskmanager.io
- Prometheus: https://prometheus.taskmanager.io
- Kibana: https://kibana.taskmanager.io

### Emergency Contacts
- On-call: [PagerDuty/Slack channel]
- DevOps Team: devops@taskmanager.io
- Security: security@taskmanager.io

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Maintainer**: DevOps Team
