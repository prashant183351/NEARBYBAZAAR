# Feature #159: Docker Compose for Local Development

## Overview

This feature provides a Docker Compose configuration for running MongoDB and Redis locally, simplifying development setup and ensuring consistent environments across the team.

## What's Included

### 1. Docker Compose Configuration (`docker-compose.yml`)

**Services**:

- **MongoDB 7.0**: Database with persistent storage and health checks
- **Redis 7.2**: Cache and queue system with persistent storage
- **Mongo Express** (optional): Web UI for MongoDB on port 8081
- **Redis Commander** (optional): Web UI for Redis on port 8082

**Features**:

- ✅ Persistent data volumes (survives container restarts)
- ✅ Health checks for service readiness
- ✅ Custom network for service communication
- ✅ Pre-configured credentials (development-safe)
- ✅ Profile-based optional UIs

### 2. Service Configuration

#### MongoDB

- **Image**: `mongo:7.0`
- **Port**: `27017`
- **Username**: `admin`
- **Password**: `password123`
- **Database**: `nearbybazaar`
- **Health check**: Every 10s with mongosh ping
- **Volumes**:
  - `mongodb_data:/data/db` - Database files
  - `mongodb_config:/data/configdb` - Configuration

#### Redis

- **Image**: `redis:7.2-alpine`
- **Port**: `6379`
- **Password**: `redispass123`
- **Persistence**: AOF (Append-Only File) enabled
- **Health check**: Every 10s with redis-cli ping
- **Volumes**:
  - `redis_data:/data` - Persistent cache

### 3. Wait Script (`scripts/wait-for-services.js`)

A Node.js script that waits for MongoDB and Redis to be ready before allowing the API to start.

**Features**:

- Colored terminal output for readability
- Configurable retry attempts and delays
- Clear error messages with troubleshooting steps
- Non-blocking for services that are already ready

**Usage**:

```bash
node scripts/wait-for-services.js
```

### 4. Environment Configuration (`.env.example`)

Comprehensive environment template with:

- Docker-ready MongoDB connection string
- Docker-ready Redis connection string
- All required platform configuration
- Comments explaining each variable
- Development port references

## Quick Start

### 1. Install Docker

**Windows**:

- Download Docker Desktop from https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop

**Mac**:

```bash
brew install --cask docker
```

**Linux**:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verify
docker compose version
```

### 2. Start Services

```powershell
# Start MongoDB and Redis
docker-compose up -d

# Verify services are running
docker-compose ps

# Check health status
docker-compose ps
# Should show "healthy" for mongodb and redis
```

### 3. Verify Connection

```powershell
# Wait for services to be ready
node scripts/wait-for-services.js

# Or test manually:
# MongoDB
mongosh "mongodb://admin:password123@localhost:27017/nearbybazaar?authSource=admin"

# Redis
redis-cli -h localhost -p 6379 -a redispass123 ping
```

### 4. Start Development

```powershell
# Copy environment file (if not done)
cp .env.example .env

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

## Commands

### Basic Operations

```powershell
# Start services (creates containers if needed)
docker-compose up -d

# Stop services (keeps containers)
docker-compose stop

# Start stopped services
docker-compose start

# Restart services
docker-compose restart

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop and remove everything including data
docker-compose down -v
```

### Viewing Logs

```powershell
# All services
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Specific service
docker-compose logs mongodb
docker-compose logs redis

# Last 100 lines
docker-compose logs --tail=100
```

### Service Status

```powershell
# Check running containers
docker-compose ps

# Check resource usage
docker stats nearbybazaar-mongodb nearbybazaar-redis

# Inspect service
docker inspect nearbybazaar-mongodb
```

### Web UIs (Optional)

Start with admin interfaces:

```powershell
# Start with UIs
docker-compose --profile ui up -d

# Access UIs:
# Mongo Express: http://localhost:8081 (admin/admin123)
# Redis Commander: http://localhost:8082

# Stop UIs
docker-compose --profile ui down
```

### Data Management

```powershell
# Backup MongoDB
docker exec nearbybazaar-mongodb mongodump --out=/data/backup --username=admin --password=password123 --authenticationDatabase=admin

# Copy backup to host
docker cp nearbybazaar-mongodb:/data/backup ./backup

# Restore MongoDB
docker exec nearbybazaar-mongodb mongorestore /data/backup --username=admin --password=password123 --authenticationDatabase=admin

# View volumes
docker volume ls | grep nearbybazaar

# Remove unused volumes (careful!)
docker volume prune
```

## Connection Strings

### Development (Docker)

Add to `.env`:

```env
# MongoDB
MONGODB_URI=mongodb://admin:password123@localhost:27017/nearbybazaar?authSource=admin

# Redis
REDIS_URL=redis://:redispass123@localhost:6379
```

### Production

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nearbybazaar?retryWrites=true&w=majority

# Redis Cloud
REDIS_URL=redis://username:password@redis-server.com:6379
```

## Troubleshooting

### Services Won't Start

**Problem**: `docker-compose up` fails

**Solutions**:

```powershell
# Check if Docker is running
docker info

# Check for port conflicts
netstat -an | findstr "27017"
netstat -an | findstr "6379"

# Remove old containers
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs mongodb redis
```

### Port Already in Use

**Problem**: `Error: bind: address already in use`

**Solutions**:

```powershell
# Find process using port
Get-Process -Id (Get-NetTCPConnection -LocalPort 27017).OwningProcess

# Kill process or change port in docker-compose.yml
# Example: "27018:27017" to use port 27018 on host
```

### Health Checks Failing

**Problem**: Container shows as `unhealthy`

**Solutions**:

```powershell
# Check logs
docker-compose logs mongodb

# Restart service
docker-compose restart mongodb

# If persistent, recreate container
docker-compose down
docker-compose up -d
```

### Connection Refused

**Problem**: API can't connect to MongoDB/Redis

**Solutions**:

```powershell
# 1. Wait for services to be fully ready
node scripts/wait-for-services.js

# 2. Check services are healthy
docker-compose ps

# 3. Verify connection string in .env
cat .env | grep MONGODB_URI
cat .env | grep REDIS_URL

# 4. Test connection manually
mongosh "mongodb://admin:password123@localhost:27017/nearbybazaar?authSource=admin"
redis-cli -h localhost -p 6379 -a redispass123 ping
```

### Data Loss After Restart

**Problem**: Data disappears when containers restart

**Cause**: Using `docker-compose down -v` removes volumes

**Solution**:

```powershell
# Use this to stop (preserves data)
docker-compose stop

# Or this (removes containers but keeps volumes)
docker-compose down

# NEVER use -v flag unless you want to delete data
# docker-compose down -v  # ← Deletes volumes!
```

### Slow Performance

**Problem**: Docker containers are slow

**Solutions**:

```powershell
# 1. Allocate more resources in Docker Desktop
# Settings → Resources → Increase CPU and Memory

# 2. Check resource usage
docker stats

# 3. Prune unused data
docker system prune
```

### Web UI Not Accessible

**Problem**: Can't access Mongo Express or Redis Commander

**Solutions**:

```powershell
# 1. Make sure started with --profile ui
docker-compose --profile ui up -d

# 2. Check containers are running
docker-compose ps | findstr "mongo-express redis-commander"

# 3. Check logs
docker-compose logs mongo-express
docker-compose logs redis-commander
```

## Performance Considerations

### Resource Limits

The default configuration doesn't set memory or CPU limits. For production-like testing, add limits:

```yaml
services:
  mongodb:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
```

### Volume Performance

**Windows/Mac**: Use native Docker volumes (not bind mounts) for better performance
**Linux**: Both volumes and bind mounts perform well

### Network Performance

All services are on a custom bridge network (`nearbybazaar-network`), which is fine for development. For production, consider host networking or overlay networks.

## Security Notes

⚠️ **These credentials are for DEVELOPMENT ONLY**:

- MongoDB: `admin:password123`
- Redis: `redispass123`
- Mongo Express: `admin:admin123`

**Never use these in production!**

For production:

1. Use strong, unique passwords
2. Store credentials in secrets management (e.g., AWS Secrets Manager)
3. Enable SSL/TLS for connections
4. Restrict network access with firewalls
5. Disable web UIs or secure them properly

## Integration with API

The API should use the wait script before starting:

**Option 1**: Manual check before starting API:

```powershell
node scripts/wait-for-services.js && pnpm --filter @nearbybazaar/api dev
```

**Option 2**: Add to API's package.json:

```json
{
  "scripts": {
    "predev": "node ../../scripts/wait-for-services.js",
    "dev": "nodemon src/index.ts"
  }
}
```

**Option 3**: Use in CI/CD pipeline:

```yaml
# .github/workflows/ci.yml
- name: Wait for services
  run: node scripts/wait-for-services.js
```

## Comparison: Docker vs Local Installation

| Aspect          | Docker                        | Local Installation |
| --------------- | ----------------------------- | ------------------ |
| Setup Time      | 5 minutes                     | 30-60 minutes      |
| Consistency     | Identical across machines     | Varies by OS       |
| Isolation       | Isolated containers           | Shared system      |
| Resource Usage  | Moderate overhead             | Native performance |
| Cleanup         | Easy (docker-compose down)    | Manual uninstall   |
| Version Control | Defined in docker-compose.yml | Manual updates     |

**Recommendation**: Use Docker for development unless you have specific reasons not to.

## Files Created/Modified

### Created

1. **docker-compose.yml** - Service definitions
2. **.dockerignore** - Docker context exclusions
3. **scripts/wait-for-services.js** - Readiness check script
4. **docs/FEATURE_159_DOCKER.md** - This documentation

### Modified

1. **.env.example** - Added Docker-ready connection strings
2. **README.md** - Added Quick Start with Docker
3. **DEV.md** - Added Docker development section

## Next Steps

### For Developers

1. Install Docker Desktop
2. Run `docker-compose up -d`
3. Run `node scripts/wait-for-services.js` to verify
4. Continue with normal development workflow

### Future Enhancements

- Add Meilisearch service for search
- Add reverse proxy (Nginx) for local SSL
- Add CI/CD pipeline integration
- Add Docker Swarm or Kubernetes configs for staging
- Add monitoring (Prometheus + Grafana)

## Summary

Feature #159 provides:

- ✅ Complete Docker Compose setup for MongoDB and Redis
- ✅ Health checks ensuring services are ready
- ✅ Persistent data volumes
- ✅ Optional web UIs for easy database management
- ✅ Automated wait script for API startup
- ✅ Comprehensive documentation
- ✅ Development-optimized configuration

The setup dramatically simplifies onboarding new developers and ensures consistent environments across the team!
