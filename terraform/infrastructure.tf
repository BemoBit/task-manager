# VPC and Networking
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project_name}-${var.environment}-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = [for k, v in var.availability_zones : cidrsubnet(var.vpc_cidr, 4, k)]
  public_subnets  = [for k, v in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, k + 48)]
  database_subnets = [for k, v in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, k + 52)]

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment == "staging" ? true : false
  enable_dns_hostnames = true
  enable_dns_support   = true

  enable_flow_log                      = true
  create_flow_log_cloudwatch_iam_role  = true
  create_flow_log_cloudwatch_log_group = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-vpc"
    }
  )
}

# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "${var.project_name}-${var.environment}"
  cluster_version = var.cluster_version

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true
  cluster_endpoint_private_access = true

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  eks_managed_node_group_defaults = {
    ami_type       = "AL2_x86_64"
    instance_types = ["t3.large"]
    
    attach_cluster_primary_security_group = true
    vpc_security_group_ids                = [aws_security_group.node_group_one.id]
  }

  eks_managed_node_groups = {
    general = {
      name = "${var.project_name}-${var.environment}-general"

      instance_types = ["t3.large"]
      capacity_type  = "ON_DEMAND"

      min_size     = 3
      max_size     = 10
      desired_size = var.environment == "production" ? 5 : 3

      labels = {
        role = "general"
      }

      tags = {
        NodeGroup = "general"
      }
    }

    compute = {
      name = "${var.project_name}-${var.environment}-compute"

      instance_types = ["c6i.2xlarge"]
      capacity_type  = "SPOT"

      min_size     = 0
      max_size     = 20
      desired_size = var.environment == "production" ? 3 : 0

      labels = {
        role = "compute"
      }

      taints = [{
        key    = "workload"
        value  = "compute"
        effect = "NoSchedule"
      }]

      tags = {
        NodeGroup = "compute"
      }
    }
  }

  manage_aws_auth_configmap = true

  tags = var.tags
}

resource "aws_security_group" "node_group_one" {
  name_prefix = "${var.project_name}-${var.environment}-node-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port = 22
    to_port   = 22
    protocol  = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-node-sg"
    }
  )
}

# RDS PostgreSQL
resource "random_password" "db_password" {
  length  = 32
  special = true
}

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "${var.project_name}-${var.environment}"

  engine               = "postgres"
  engine_version       = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_encrypted     = true
  storage_type          = "gp3"

  db_name  = replace(var.project_name, "-", "")
  username = "admin"
  password = random_password.db_password.result
  port     = 5432

  multi_az               = var.environment == "production" ? true : false
  db_subnet_group_name   = module.vpc.database_subnet_group
  vpc_security_group_ids = [aws_security_group.rds.id]

  maintenance_window              = "Mon:00:00-Mon:03:00"
  backup_window                   = "03:00-06:00"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  create_cloudwatch_log_group     = true

  backup_retention_period = var.backup_retention_period
  skip_final_snapshot     = var.environment == "staging" ? true : false
  deletion_protection     = var.environment == "production" ? true : false

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  parameters = [
    {
      name  = "autovacuum"
      value = "1"
    },
    {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements"
    }
  ]

  tags = var.tags
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-${var.environment}-rds-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.node_group_one.id]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-rds-sg"
    }
  )
}

# ElastiCache Redis
resource "random_password" "redis_password" {
  length  = 32
  special = false
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-${var.environment}-redis"
  subnet_ids = module.vpc.database_subnets

  tags = var.tags
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.project_name}-${var.environment}"
  replication_group_description = "Redis cluster for ${var.project_name} ${var.environment}"
  
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.redis_node_type
  num_cache_clusters   = var.redis_num_cache_nodes
  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_password.result

  automatic_failover_enabled = var.environment == "production" ? true : false
  multi_az_enabled          = var.environment == "production" ? true : false

  maintenance_window       = "mon:05:00-mon:07:00"
  snapshot_window          = "03:00-05:00"
  snapshot_retention_limit = 5

  tags = var.tags
}

resource "aws_security_group" "redis" {
  name_prefix = "${var.project_name}-${var.environment}-redis-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.node_group_one.id]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-redis-sg"
    }
  )
}

# S3 Buckets
resource "aws_s3_bucket" "backups" {
  bucket = "${var.project_name}-${var.environment}-backups"

  tags = var.tags
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "delete-old-backups"
    status = "Enabled"

    expiration {
      days = 90
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 60
      storage_class = "GLACIER"
    }
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} ${var.environment} frontend"
  default_root_object = "index.html"
  price_class         = var.environment == "production" ? "PriceClass_All" : "PriceClass_100"

  aliases = var.environment == "production" ? [
    var.domain_name,
    "www.${var.domain_name}"
  ] : ["staging.${var.domain_name}"]

  origin {
    domain_name = "${var.project_name}-${var.environment}-alb.${var.aws_region}.elb.amazonaws.com"
    origin_id   = "frontend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "frontend"

    forwarded_values {
      query_string = true
      headers      = ["Host", "CloudFront-Forwarded-Proto"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.frontend.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = var.tags
}

# ACM Certificate
resource "aws_acm_certificate" "frontend" {
  provider = aws.us-east-1

  domain_name = var.domain_name
  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = var.tags
}

# Route53
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = var.tags
}

resource "aws_route53_record" "frontend" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.environment == "production" ? var.domain_name : "staging.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

# Secrets Manager
resource "aws_secretsmanager_secret" "db_credentials" {
  name = "${var.project_name}-${var.environment}-db-credentials"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = module.rds.db_instance_username
    password = random_password.db_password.result
    endpoint = module.rds.db_instance_endpoint
    database = module.rds.db_instance_name
  })
}

resource "aws_secretsmanager_secret" "redis_credentials" {
  name = "${var.project_name}-${var.environment}-redis-credentials"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "redis_credentials" {
  secret_id = aws_secretsmanager_secret.redis_credentials.id
  secret_string = jsonencode({
    password = random_password.redis_password.result
    endpoint = aws_elasticache_replication_group.redis.configuration_endpoint_address
    port     = 6379
  })
}
