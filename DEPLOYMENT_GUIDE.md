# SnowBooks Deployment Guide 🚀

This guide provides step-by-step instructions for deploying SnowBooks in different environments.

## 🏃‍♂️ Quick Start (Development)

### Prerequisites
- Docker and Docker Compose installed
- Git for cloning the repository

### 1-Command Setup
```bash
./scripts/dev-setup.sh
```

This script will:
- ✅ Check Docker installation
- ✅ Create necessary directories
- ✅ Set up environment files
- ✅ Build and start all services
- ✅ Verify service health
- ✅ Display access URLs

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api
- **Redis**: localhost:6379

## 🧪 Testing

### End-to-End Testing
```bash
./scripts/test-e2e.sh
```

This will test:
- ✅ Backend health and API endpoints
- ✅ Redis connectivity
- ✅ Frontend accessibility
- ✅ File upload/processing workflow
- ✅ WebSocket connections

### Manual Testing Workflow
1. **Upload**: Go to http://localhost:5173 and upload a ZIP with MP3 files
2. **Configure**: Set white noise volume (0-100%)
3. **Process**: Start processing and watch real-time progress
4. **Download**: Download the processed ZIP file

## 🐳 Docker Commands

### Using Make (Recommended)
```bash
make setup    # Initial setup
make dev      # Start development
make test     # Run tests
make logs     # View logs
make clean    # Clean up
make deploy   # Production deployment
```

### Using Docker Compose Directly
```bash
# Development
docker compose up -d
docker compose logs -f
docker compose down

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🏭 Production Deployment

### Environment Setup
1. **Create production environment files**:
   ```bash
   cp backend/.env backend/.env.production
   cp app/.env app/.env.production
   ```

2. **Update production variables**:
   ```env
   # backend/.env.production
   NODE_ENV=production
   REDIS_HOST=redis
   CORS_ORIGIN=https://yourdomain.com
   LOG_LEVEL=info
   
   # app/.env.production
   VITE_API_URL=https://yourdomain.com/api
   VITE_WS_URL=https://yourdomain.com
   ```

### SSL/HTTPS Setup
1. **Place SSL certificates** in `nginx/ssl/`:
   ```
   nginx/ssl/
   ├── cert.pem
   └── key.pem
   ```

2. **Update nginx configuration** in `nginx/nginx.conf`

### Production Deployment
```bash
# Build and deploy
make deploy

# Or manually
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## 📊 Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:3001/api/health

# Frontend accessibility
curl http://localhost:5173

# Redis connectivity
docker-compose exec redis redis-cli ping
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis
```

### Service Status
```bash
docker-compose ps
make status
```

## 🔧 Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check Docker daemon
docker info

# Rebuild containers
docker compose build --no-cache
docker compose up -d
```

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :3001  # Backend
lsof -i :5173  # Frontend
lsof -i :6379  # Redis
```

#### Permission Issues
```bash
# Fix directory permissions
sudo chown -R $USER:$USER backend/uploads backend/temp
```

#### FFmpeg Issues
```bash
# Test FFmpeg in container
docker compose exec backend ffmpeg -version
```

### Reset Everything
```bash
make clean
make setup
```

## 🔒 Security Considerations

### Production Security
- ✅ Use HTTPS/SSL certificates
- ✅ Configure proper CORS origins
- ✅ Set secure environment variables
- ✅ Use non-root users in containers
- ✅ Implement rate limiting
- ✅ Regular security updates

### File Upload Security
- ✅ File size limits configured
- ✅ File type validation (ZIP/MP3 only)
- ✅ Temporary file cleanup
- ✅ Sandboxed processing environment

## 📈 Performance Tuning

### Resource Limits
```yaml
# docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '1.0'
```

### Redis Configuration
```bash
# Optimize for your use case
redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### FFmpeg Optimization
- Concurrent job limits: `MAX_CONCURRENT_JOBS=3`
- Processing timeout: `JOB_TIMEOUT=1800000` (30 minutes)

## 🆘 Support

### Getting Help
1. Check logs: `make logs`
2. Run health checks: `./scripts/test-e2e.sh`
3. Review configuration files
4. Check Docker resources: `docker system df`

### Useful Commands
```bash
# Container shell access
docker compose exec backend sh
docker compose exec frontend sh

# Database access
docker compose exec redis redis-cli

# File system access
docker compose exec backend ls -la uploads/
```

## 🎯 Next Steps

After successful deployment:
1. ✅ Test with real audiobook files
2. ✅ Monitor resource usage
3. ✅ Set up automated backups
4. ✅ Configure monitoring/alerting
5. ✅ Plan scaling strategy

---

**🎉 Congratulations! SnowBooks is now ready for production use.**
