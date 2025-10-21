import IORedis from 'ioredis';

// Reuse the same env if provided; in tests, avoid connecting
const shouldConnect = process.env.NODE_ENV !== 'test' && process.env.NO_REDIS !== 'true';

let redis: IORedis | undefined;
if (shouldConnect) {
  redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null as unknown as number,
  } as any);
}

export const getRedis = () => redis;
