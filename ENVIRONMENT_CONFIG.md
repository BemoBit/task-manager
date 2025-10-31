# Environment Configuration

This file contains all environment-specific configurations for the TaskManager application.

## 🔐 Secrets Configuration

### Backend Secrets

Required secrets in Kubernetes:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: backend-secrets
  namespace: production
type: Opaque
stringData:
  # Database
  database-url: "postgresql://user:password@host:5432/database"
  
  # Redis
  redis-password: "your-redis-password"
  
  # JWT
  jwt-secret: "your-jwt-secret"
  jwt-refresh-secret: "your-jwt-refresh-secret"
  
  # AI Providers
  openai-api-key: "sk-..."
  anthropic-api-key: "sk-ant-..."
  google-api-key: "..."
```

### Creating Secrets

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Create from AWS Secrets Manager
DB_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id taskmanager-production-db-credentials \
  --query SecretString --output text)

REDIS_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id taskmanager-production-redis-credentials \
  --query SecretString --output text)

# Apply to Kubernetes
kubectl create secret generic backend-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=redis-password="$REDIS_PASSWORD" \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --from-literal=jwt-refresh-secret="$JWT_REFRESH_SECRET" \
  --from-literal=openai-api-key="$OPENAI_API_KEY" \
  --from-literal=anthropic-api-key="$ANTHROPIC_API_KEY" \
  --namespace=production
```

## 🌍 Environment Variables

### Staging Environment

```bash
# Application
NODE_ENV=staging
PORT=3001
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://admin:password@staging-db.example.com:5432/taskmanager
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=staging-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=<from-secret>
REDIS_TTL=3600

# JWT
JWT_SECRET=<from-secret>
JWT_REFRESH_SECRET=<from-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://staging.taskmanager.io

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# AI Providers
OPENAI_API_KEY=<from-secret>
ANTHROPIC_API_KEY=<from-secret>
GOOGLE_API_KEY=<from-secret>
```

### Production Environment

```bash
# Application
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://admin:password@prod-db.example.com:5432/taskmanager
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=50
DATABASE_STATEMENT_TIMEOUT=30000

# Redis
REDIS_HOST=prod-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=<from-secret>
REDIS_TTL=7200
REDIS_CLUSTER_MODE=true

# JWT
JWT_SECRET=<from-secret>
JWT_REFRESH_SECRET=<from-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://taskmanager.io,https://www.taskmanager.io

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090

# AI Providers
OPENAI_API_KEY=<from-secret>
ANTHROPIC_API_KEY=<from-secret>
GOOGLE_API_KEY=<from-secret>
AI_REQUEST_TIMEOUT=30000
AI_MAX_RETRIES=3
```

## 🔧 ConfigMaps

### Backend ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: production
data:
  # Redis
  redis-host: "redis-service"
  redis-port: "6379"
  redis-ttl: "7200"
  
  # JWT
  jwt-expires-in: "15m"
  jwt-refresh-expires-in: "7d"
  
  # CORS
  cors-origin: "https://taskmanager.io"
  
  # Logging
  log-level: "info"
  
  # Rate Limiting
  rate-limit-ttl: "60"
  rate-limit-max: "100"
  
  # Database
  database-pool-min: "5"
  database-pool-max: "50"
  
  # Features
  enable-metrics: "true"
  enable-tracing: "true"
```

### Frontend ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config
  namespace: production
data:
  # API
  api-url: "https://api.taskmanager.io"
  
  # Features
  enable-analytics: "true"
  enable-error-tracking: "true"
```

## 🏗️ Infrastructure Configuration

### AWS Resources

**VPC**:
- CIDR: `10.0.0.0/16`
- Availability Zones: 3 (us-east-1a, us-east-1b, us-east-1c)
- Public Subnets: 3
- Private Subnets: 3
- Database Subnets: 3
- NAT Gateways: 3 (1 per AZ in production)

**EKS**:
- Version: 1.28
- Node Groups:
  - General: t3.large, 3-10 nodes
  - Compute: c6i.2xlarge (Spot), 0-20 nodes

**RDS PostgreSQL**:
- Engine: PostgreSQL 15.4
- Instance: db.r6g.xlarge (production), db.t3.large (staging)
- Storage: 200GB (production), 100GB (staging)
- Multi-AZ: Enabled in production
- Backups: 30 days retention (production), 7 days (staging)

**ElastiCache Redis**:
- Engine: Redis 7.0
- Node Type: cache.r6g.large (production), cache.t3.medium (staging)
- Nodes: 3 (production), 2 (staging)
- Multi-AZ: Enabled in production

**CloudFront**:
- Price Class: PriceClass_All (production), PriceClass_100 (staging)
- SSL/TLS: TLS 1.2+
- Caching: Enabled for static assets

**S3 Buckets**:
- Backups: `taskmanager-{env}-backups`
- Logs: `taskmanager-{env}-logs`
- Static Assets: `taskmanager-{env}-assets`

## 🔒 SSL/TLS Configuration

### Certificate Configuration

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: taskmanager-tls
  namespace: production
spec:
  secretName: taskmanager-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - taskmanager.io
    - www.taskmanager.io
    - api.taskmanager.io
    - monitoring.taskmanager.io
    - grafana.taskmanager.io
    - prometheus.taskmanager.io
    - kibana.taskmanager.io
    - jaeger.taskmanager.io
```

## 📊 Monitoring Configuration

### Prometheus

- Scrape Interval: 15s
- Retention: 15 days
- Storage: 100GB

### Grafana

- Admin User: admin
- Admin Password: <from-secret>
- Datasources: Prometheus, Loki, Jaeger

### Alertmanager

- Slack Channel: #alerts
- PagerDuty: Enabled for critical alerts
- Email: alerts@taskmanager.io

### ELK Stack

- Elasticsearch Nodes: 3
- Storage per Node: 100GB
- Retention: 7 days

## 🚨 Alert Thresholds

### Application Alerts

- **High Error Rate**: >5% 5xx responses for 5 minutes
- **High Latency**: p95 latency >1s for 5 minutes
- **High Memory Usage**: >90% for 5 minutes
- **High CPU Usage**: >80% for 5 minutes
- **Pod Crash Loop**: Any restart in 15 minutes

### Infrastructure Alerts

- **Node Not Ready**: Any node not ready for 5 minutes
- **Disk Usage**: >85% on any volume
- **Database Connections**: >80% of max connections
- **Redis Memory**: >90% of max memory

### Database Alerts

- **PostgreSQL Down**: Instance unreachable for 1 minute
- **High Connections**: >80 connections for 5 minutes
- **Slow Queries**: Query time >10s
- **Replication Lag**: >30s lag

## 📱 Resource Limits

### Pod Resources

**Backend**:
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

**Frontend**:
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

**Redis**:
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Auto-Scaling Policies

**HPA**:
- Target CPU: 70%
- Target Memory: 80%
- Scale Up: +50% or 2 pods per 60s
- Scale Down: -50% or 1 pod per 60s
- Stabilization: 60s (up), 300s (down)

**Cluster Autoscaler**:
- Scale Up: When pods are pending
- Scale Down: When node utilization <50% for 10 minutes
- Max Nodes: 10 (production), 5 (staging)

## 🔄 Backup Configuration

### Database Backups

- **Frequency**: Daily at 3:00 AM UTC
- **Retention**: 30 days (production), 7 days (staging)
- **Type**: Automated RDS snapshots + logical backups
- **Storage**: S3 with versioning

### Redis Backups

- **Frequency**: Daily at 4:00 AM UTC
- **Retention**: 7 days
- **Type**: RDB snapshots
- **Storage**: S3

### Application Data

- **Frequency**: Continuous
- **Type**: S3 sync for user uploads
- **Versioning**: Enabled

## 🌐 DNS Configuration

### Route53 Records

```
taskmanager.io                 A    → CloudFront Distribution
www.taskmanager.io             A    → CloudFront Distribution
api.taskmanager.io             A    → Load Balancer
staging.taskmanager.io         A    → CloudFront Distribution
staging-api.taskmanager.io     A    → Load Balancer
grafana.taskmanager.io         A    → Load Balancer
prometheus.taskmanager.io      A    → Load Balancer
kibana.taskmanager.io          A    → Load Balancer
jaeger.taskmanager.io          A    → Load Balancer
```

---

**Important**: Always use AWS Secrets Manager or Kubernetes Secrets for sensitive data. Never commit secrets to version control.
