# Reader Application - Production Deployment Guide

## Prerequisites

- Docker và Docker Compose đã được cài đặt
- Supabase project đã được setup
- Google OAuth credentials đã được tạo
- Cloudflare Tunnel (hoặc domain) đã được cấu hình

## Environment Setup

1. **Copy environment template:**
   ```bash
   cp env.example .env
   ```

2. **Configure environment variables in `.env`:**
   ```bash
   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Frontend URL (for OAuth redirects)
   FRONTEND_URL=http://localhost:3000
   
   # Redis Configuration
   REDIS_URL=redis://localhost:6379
   
   # Storage Configuration
   STORAGE_PATH=./storage
   
   # Environment
   ENVIRONMENT=production
   ```

## Docker Compose Deployment

### Quick Start

1. **Start all services:**
   ```bash
   ./deploy.sh start
   ```

2. **Check service status:**
   ```bash
   ./deploy.sh status
   ```

3. **View logs:**
   ```bash
   ./deploy.sh logs
   ```

### Manual Deployment

1. **Start services:**
   ```bash
   docker compose up -d
   ```

2. **Check logs:**
   ```bash
   docker compose logs -f
   ```

3. **Stop services:**
   ```bash
   docker compose down
   ```

## Service Overview

### Frontend (Nuxt.js)
- **Image:** `fevirtus/reader:latest`
- **Port:** 3000
- **URL:** http://localhost:3000
- **Health Check:** http://localhost:3000

### Backend (FastAPI)
- **Image:** `fevirtus/reader-be:latest`
- **Port:** 8000
- **URL:** http://localhost:8000
- **Health Check:** http://localhost:8000/health
- **API Docs:** http://localhost:8000/docs

### Redis (Caching)
- **Image:** `redis:7-alpine`
- **Port:** 6379
- **Data Persistence:** Yes (volume mounted)

## Management Commands

### Using deploy.sh script:
```bash
./deploy.sh start      # Start all services
./deploy.sh stop       # Stop all services
./deploy.sh restart    # Restart all services
./deploy.sh logs       # Show all logs
./deploy.sh logs frontend  # Show frontend logs
./deploy.sh logs backend   # Show backend logs
./deploy.sh status     # Check service status
./deploy.sh cleanup    # Remove all containers and volumes
./deploy.sh update     # Pull latest images and restart
```

### Using Docker Compose directly:
```bash
docker compose up -d           # Start services
docker compose down            # Stop services
docker compose logs -f         # Follow logs
docker compose ps              # Check status
docker compose pull            # Pull latest images
```

## Storage and Data

### Persistent Storage
- **Backend Storage:** `./reader-be/storage` → `/app/storage`
- **Redis Data:** `redis_data` volume

### Backup Recommendations
```bash
# Backup storage directory
tar -czf storage-backup-$(date +%Y%m%d).tar.gz ./reader-be/storage

# Backup Redis data
docker compose exec redis redis-cli BGSAVE
```

## Cloudflare Tunnel Setup

1. **Install cloudflared:**
   ```bash
   # macOS
   brew install cloudflare/cloudflare/cloudflared
   
   # Linux
   wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   ```

2. **Authenticate:**
   ```bash
   cloudflared tunnel login
   ```

3. **Create tunnel:**
   ```bash
   cloudflared tunnel create reader-app
   ```

4. **Configure tunnel:**
   ```bash
   # Get tunnel ID
   cloudflared tunnel list
   
   # Create config file
   cat > ~/.cloudflared/config.yml << EOF
   tunnel: YOUR_TUNNEL_ID
   credentials-file: ~/.cloudflared/YOUR_TUNNEL_ID.json
   
   ingress:
     - hostname: your-domain.com
       service: http://localhost:3000
     - hostname: api.your-domain.com
       service: http://localhost:8000
     - service: http_status:404
   EOF
   ```

5. **Start tunnel:**
   ```bash
   cloudflared tunnel run reader-app
   ```

## Security Considerations

### Environment Variables
- ✅ Never commit `.env` files to version control
- ✅ Use strong, unique passwords for database
- ✅ Rotate API keys regularly
- ✅ Use HTTPS in production

### Network Security
- ✅ Services communicate via internal Docker network
- ✅ Only necessary ports exposed to host
- ✅ Health checks implemented for all services

### Data Security
- ✅ Storage volumes properly mounted
- ✅ Redis persistence enabled
- ✅ Regular backups recommended

## Monitoring and Troubleshooting

### Health Checks
```bash
# Check frontend health
curl -f http://localhost:3000

# Check backend health
curl -f http://localhost:8000/health

# Check Redis
docker compose exec redis redis-cli ping
```

### Common Issues

#### Frontend not loading
```bash
# Check frontend logs
./deploy.sh logs frontend

# Check if frontend container is running
docker compose ps frontend
```

#### Backend API errors
```bash
# Check backend logs
./deploy.sh logs backend

# Check environment variables
docker compose exec backend env | grep -E "(SUPABASE|GOOGLE|DATABASE)"
```

#### Redis connection issues
```bash
# Check Redis logs
./deploy.sh logs redis

# Test Redis connection
docker compose exec redis redis-cli ping
```

### Log Analysis
```bash
# Follow all logs
docker compose logs -f

# Follow specific service
docker compose logs -f backend

# Search logs
docker compose logs | grep ERROR
```

## Updates and Maintenance

### Update Application
```bash
# Pull latest images and restart
./deploy.sh update

# Or manually
docker compose pull
docker compose down
docker compose up -d
```

### Database Migrations
```bash
# Access backend container
docker compose exec backend bash

# Run migrations (if needed)
# python -m alembic upgrade head
```

### Storage Management
```bash
# Check storage usage
du -sh ./reader-be/storage

# Clean up old files (if needed)
find ./reader-be/storage -name "*.tmp" -delete
```

## Performance Optimization

### Resource Limits
```yaml
# Add to docker-compose.yml services if needed
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
  
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```

### Caching Strategy
- ✅ Redis for API response caching
- ✅ Frontend static assets cached
- ✅ Database query optimization

## Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

# Backup storage
tar -czf "$BACKUP_DIR/storage_$DATE.tar.gz" ./reader-be/storage

# Backup Redis
docker compose exec redis redis-cli BGSAVE
cp ./reader-be/storage/redis/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

echo "Backup completed: $BACKUP_DIR"
```

### Recovery Process
```bash
# Restore storage
tar -xzf backups/storage_YYYYMMDD_HHMMSS.tar.gz

# Restore Redis (if needed)
# docker compose exec redis redis-cli FLUSHALL
# docker compose exec redis redis-cli RESTORE key 0 "$(cat backups/redis_YYYYMMDD_HHMMSS.rdb)"
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Docker images built and pushed
- [ ] Cloudflare Tunnel configured
- [ ] SSL certificates installed
- [ ] Health checks passing
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Security measures in place
- [ ] Performance optimized
- [ ] Documentation updated 