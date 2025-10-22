# Docker Compose Quick Reference

## Start & Stop

```powershell
# Start services
docker-compose up -d

# Stop services (keeps data)
docker-compose stop

# Stop and remove containers (keeps data volumes)
docker-compose down

# Remove everything including data
docker-compose down -v
```

## Status & Logs

```powershell
# Check status
docker-compose ps

# View logs
docker-compose logs
docker-compose logs -f              # Follow
docker-compose logs mongodb         # Specific service
docker-compose logs --tail=100      # Last 100 lines

# Resource usage
docker stats nearbybazaar-mongodb nearbybazaar-redis
```

## Connection Info

### MongoDB

- **URL**: `mongodb://admin:password123@localhost:27017/nearbybazaar?authSource=admin`
- **Port**: 27017
- **Username**: admin
- **Password**: password123
- **Database**: nearbybazaar

### Redis

- **URL**: `redis://:redispass123@localhost:6379`
- **Port**: 6379
- **Password**: redispass123

### Web UIs (Optional)

```powershell
# Start with UIs
docker-compose --profile ui up -d

# Mongo Express: http://localhost:8081 (admin/admin123)
# Redis Commander: http://localhost:8082
```

## Verify Services

```powershell
# Wait for readiness
node scripts/wait-for-services.js

# Test MongoDB
mongosh "mongodb://admin:password123@localhost:27017/nearbybazaar?authSource=admin"

# Test Redis
redis-cli -h localhost -p 6379 -a redispass123 ping
```

## Data Management

```powershell
# List volumes
docker volume ls | grep nearbybazaar

# Backup MongoDB
docker exec nearbybazaar-mongodb mongodump --out=/data/backup --username=admin --password=password123 --authenticationDatabase=admin

# Restore MongoDB
docker exec nearbybazaar-mongodb mongorestore /data/backup --username=admin --password=password123 --authenticationDatabase=admin
```

## Troubleshooting

```powershell
# Restart services
docker-compose restart

# Recreate containers
docker-compose down
docker-compose up -d

# Check health
docker-compose ps

# View detailed logs
docker-compose logs mongodb redis

# Clean up unused resources
docker system prune
```

## Common Issues

**Port conflict**: Change port in docker-compose.yml

```yaml
ports: ['27018:27017'] # Use 27018 instead
```

**Connection refused**: Wait for services

```powershell
node scripts/wait-for-services.js
```

**Data loss**: Don't use `-v` flag

```powershell
docker-compose down     # Good - keeps data
docker-compose down -v  # Bad - deletes data!
```

## Environment Variables

Add to `.env`:

```env
MONGODB_URI=mongodb://admin:password123@localhost:27017/nearbybazaar?authSource=admin
REDIS_URL=redis://:redispass123@localhost:6379
```

## Full Documentation

See `docs/FEATURE_159_DOCKER.md` for complete guide.
