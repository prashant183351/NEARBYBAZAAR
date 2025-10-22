#!/usr/bin/env node

/**
 * Wait for Docker services (MongoDB and Redis) to be ready
 *
 * This script checks if MongoDB and Redis are accessible before
 * allowing the API to start. Prevents connection errors during startup.
 *
 * Usage:
 *   node scripts/wait-for-services.js
 *
 * Environment Variables:
 *   MONGODB_URI - MongoDB connection string (default: mongodb://admin:password123@localhost:27017/nearbybazaar?authSource=admin)
 *   REDIS_URL - Redis connection string (default: redis://:redispass123@localhost:6379)
 *   MAX_RETRIES - Maximum retry attempts (default: 30)
 *   RETRY_DELAY - Delay between retries in ms (default: 2000)
 */

const { MongoClient } = require('mongodb');
const Redis = require('ioredis');

// Configuration
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://admin:password123@localhost:27017/nearbybazaar?authSource=admin';
const REDIS_URL = process.env.REDIS_URL || 'redis://:redispass123@localhost:6379';
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '30', 10);
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || '2000', 10);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if MongoDB is ready
 */
async function checkMongoDB(attempt) {
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
  });

  try {
    console.log(
      `${colors.cyan}[${attempt}/${MAX_RETRIES}]${colors.reset} Checking MongoDB connection...`,
    );

    await client.connect();
    await client.db().admin().ping();

    console.log(`${colors.green}✓${colors.reset} MongoDB is ready!`);
    return true;
  } catch (error) {
    console.log(`${colors.yellow}⚠${colors.reset} MongoDB not ready: ${error.message}`);
    return false;
  } finally {
    await client.close();
  }
}

/**
 * Check if Redis is ready
 */
async function checkRedis(attempt) {
  const redis = new Redis(REDIS_URL, {
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });

  try {
    console.log(
      `${colors.cyan}[${attempt}/${MAX_RETRIES}]${colors.reset} Checking Redis connection...`,
    );

    await redis.connect();
    await redis.ping();

    console.log(`${colors.green}✓${colors.reset} Redis is ready!`);
    return true;
  } catch (error) {
    console.log(`${colors.yellow}⚠${colors.reset} Redis not ready: ${error.message}`);
    return false;
  } finally {
    redis.disconnect();
  }
}

/**
 * Wait for services with retry logic
 */
async function waitForServices() {
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}Waiting for Docker services to be ready...${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  let attempt = 0;
  let mongoReady = false;
  let redisReady = false;

  while (attempt < MAX_RETRIES) {
    attempt++;

    // Check MongoDB if not ready yet
    if (!mongoReady) {
      mongoReady = await checkMongoDB(attempt);
    }

    // Check Redis if not ready yet
    if (!redisReady) {
      redisReady = await checkRedis(attempt);
    }

    // If both are ready, we're done
    if (mongoReady && redisReady) {
      console.log(`\n${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.green}✓ All services are ready!${colors.reset}`);
      console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
      process.exit(0);
    }

    // Wait before next retry
    if (attempt < MAX_RETRIES) {
      console.log(`${colors.yellow}Retrying in ${RETRY_DELAY / 1000}s...${colors.reset}\n`);
      await sleep(RETRY_DELAY);
    }
  }

  // Max retries reached
  console.error(`\n${colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.error(
    `${colors.red}✗ Services failed to start after ${MAX_RETRIES} attempts${colors.reset}`,
  );
  console.error(`${colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  console.error('Troubleshooting:');
  console.error('1. Ensure Docker is running');
  console.error('2. Run: docker-compose up -d');
  console.error('3. Check logs: docker-compose logs mongodb redis');
  console.error('4. Check status: docker-compose ps\n');

  process.exit(1);
}

// Handle interrupts gracefully
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Interrupted by user${colors.reset}`);
  process.exit(130);
});

// Run the script
waitForServices().catch((error) => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
  process.exit(1);
});
