import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const globalForRedis = global as unknown as {
  redisClient?: Redis;
  redisSub?: Redis;
};

export const redis =
  globalForRedis.redisClient ||
  new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
  });

export const redisSubscriber =
  globalForRedis.redisSub ||
  new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
  });

// Auto-conectar clientes si están en estado de espera
if (redis.status === "wait") {
  redis.connect().catch(() => {});
}

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redisClient = redis;
  globalForRedis.redisSub = redisSubscriber;
}
