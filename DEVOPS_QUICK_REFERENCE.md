# DevOps Quick Reference

Quick commands and references for common operations.

## 🚀 Quick Start

```bash
# Deploy everything
ENVIRONMENT=production ./scripts/deploy-infrastructure.sh

# Health check
./scripts/health-check.sh

# Backup
./scripts/backup.sh

# Restore
BACKUP_FILE=backup-20231201.sql.gz ./scripts/restore.sh
```

## 📦 Deployment Commands

### Infrastructure

```bash
# Deploy infrastructure with Terraform
cd terraform
terraform init
terraform plan -var="environment=production"
terraform apply -var="environment=production"

# Get cluster credentials
aws eks update-kubeconfig --name taskmanager-production --region us-east-1
```

### Application

```bash
# Deploy to staging
kubectl apply -k k8s/overlays/staging

# Deploy to production
kubectl apply -k k8s/overlays/production

# Update image
kubectl set image deployment/backend-deployment \
  backend=ghcr.io/bemobit/task-manager/backend:v1.0.0 \
  -n production

# Rollback
./scripts/rollback.sh [backend|frontend|all]
```

## 🔍 Monitoring Commands

```bash
# View logs
kubectl logs -f deployment/backend-deployment -n production
kubectl logs -f deployment/frontend-deployment -n production

# View pods
kubectl get pods -n production
kubectl get pods -n monitoring

# View metrics
kubectl top pods -n production
kubectl top nodes

# Port-forward monitoring tools
kubectl port-forward -n monitoring svc/grafana 3000:3000
kubectl port-forward -n monitoring svc/prometheus 9090:9090
kubectl port-forward -n monitoring svc/kibana 5601:5601
```

## 🔧 Debug Commands

```bash
# Describe pod
kubectl describe pod <pod-name> -n production

# Execute in pod
kubectl exec -it <pod-name> -n production -- /bin/sh

# View events
kubectl get events -n production --sort-by='.lastTimestamp'

# Check HPA
kubectl get hpa -n production

# Check ingress
kubectl get ingress -A

# Check certificates
kubectl get certificate -n production
```

## 💾 Backup & Restore

```bash
# List backups
aws s3 ls s3://taskmanager-production-backups/postgresql/

# Backup now
ENVIRONMENT=production ./scripts/backup.sh

# Restore
ENVIRONMENT=production \
BACKUP_FILE=backup-20231201.sql.gz \
./scripts/restore.sh
```

## 🔐 Security

```bash
# View secrets
kubectl get secrets -n production

# Create secret
kubectl create secret generic my-secret \
  --from-literal=key=value \
  -n production

# Update SSL certificates
./scripts/setup-ssl.sh

# Rotate secrets
kubectl create secret generic backend-secrets \
  --from-literal=jwt-secret=$(openssl rand -base64 32) \
  --dry-run=client -o yaml | kubectl apply -f -
```

## 📊 Scaling

```bash
# Manual scale
kubectl scale deployment/backend-deployment --replicas=10 -n production

# View HPA status
kubectl get hpa -n production

# Edit HPA
kubectl edit hpa backend-hpa -n production
```

## 🗄️ Database

```bash
# Connect to PostgreSQL
kubectl run psql --image=postgres:15-alpine --rm -it --restart=Never \
  --env="PGPASSWORD=$PASSWORD" \
  -- psql -h $RDS_ENDPOINT -U admin -d taskmanager

# Run migrations
kubectl run migration --image=ghcr.io/bemobit/task-manager/backend:latest \
  --restart=Never --env="DATABASE_URL=$DATABASE_URL" \
  -- npx prisma migrate deploy

# Backup database
kubectl run pg-dump --image=postgres:15-alpine --rm -it --restart=Never \
  --env="PGPASSWORD=$PASSWORD" \
  -- pg_dump -h $RDS_ENDPOINT -U admin taskmanager > backup.sql
```

## 🔴 Redis

```bash
# Connect to Redis
kubectl run redis-cli --image=redis:7-alpine --rm -it --restart=Never \
  -- redis-cli -h $REDIS_ENDPOINT -a $PASSWORD

# Clear cache
kubectl run redis-cli --image=redis:7-alpine --rm -it --restart=Never \
  -- redis-cli -h $REDIS_ENDPOINT -a $PASSWORD FLUSHALL

# Monitor Redis
kubectl run redis-cli --image=redis:7-alpine --rm -it --restart=Never \
  -- redis-cli -h $REDIS_ENDPOINT -a $PASSWORD MONITOR
```

## 🌐 Networking

```bash
# Test connectivity
kubectl run curl --image=curlimages/curl:latest --rm -it --restart=Never \
  -- curl http://backend-service.production:3001/health

# View services
kubectl get svc -A

# View endpoints
kubectl get endpoints -n production

# Check network policies
kubectl get networkpolicies -n production
```

## 📈 Performance

```bash
# View resource usage
kubectl top pods -n production --sort-by=memory
kubectl top pods -n production --sort-by=cpu
kubectl top nodes

# View resource quotas
kubectl get resourcequota -n production

# View limit ranges
kubectl get limitrange -n production
```

## 🔄 CI/CD

```bash
# Trigger workflow manually
gh workflow run backend-ci.yml -f environment=production

# View workflow runs
gh run list

# View workflow logs
gh run view <run-id> --log
```

## 🆘 Emergency Procedures

### Application Down

```bash
# 1. Check pod status
kubectl get pods -n production

# 2. Check logs
kubectl logs -l app=backend -n production --tail=100

# 3. Check events
kubectl get events -n production --sort-by='.lastTimestamp'

# 4. Rollback if needed
./scripts/rollback.sh all

# 5. Scale up if necessary
kubectl scale deployment/backend-deployment --replicas=10 -n production
```

### Database Issues

```bash
# 1. Check connections
kubectl run psql --image=postgres:15-alpine --rm -it --restart=Never \
  --env="PGPASSWORD=$PASSWORD" \
  -- psql -h $RDS_ENDPOINT -U admin -d taskmanager -c "SELECT count(*) FROM pg_stat_activity;"

# 2. Kill long-running queries
-- psql> SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes';

# 3. Restore from backup if corrupted
BACKUP_FILE=latest.sql.gz ./scripts/restore.sh
```

### High Traffic

```bash
# 1. Scale up immediately
kubectl scale deployment/backend-deployment --replicas=20 -n production
kubectl scale deployment/frontend-deployment --replicas=20 -n production

# 2. Check HPA limits
kubectl get hpa -n production

# 3. Monitor performance
kubectl top pods -n production

# 4. Check CDN cache hit rate
aws cloudfront get-distribution-stats --id $DISTRIBUTION_ID
```

## 📋 Maintenance

```bash
# Update cluster
eksctl upgrade cluster --name taskmanager-production --approve

# Update node groups
eksctl upgrade nodegroup \
  --cluster=taskmanager-production \
  --name=general \
  --region=us-east-1

# Drain node for maintenance
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Uncordon node
kubectl uncordon <node-name>
```

## 🔗 Useful Links

- **Grafana**: https://grafana.taskmanager.io
- **Prometheus**: https://prometheus.taskmanager.io
- **Kibana**: https://kibana.taskmanager.io
- **Jaeger**: https://jaeger.taskmanager.io
- **Application**: https://taskmanager.io
- **API**: https://api.taskmanager.io

## 📞 Contacts

- **On-Call**: [PagerDuty]
- **DevOps Team**: devops@taskmanager.io
- **Slack**: #devops-alerts

---

For detailed information, see [DEVOPS_GUIDE.md](DEVOPS_GUIDE.md)
