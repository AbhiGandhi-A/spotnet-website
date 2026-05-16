import Redis, { RedisOptions } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

let redisClient: Redis | null = null;
let pubClient: Redis | null = null;
let subClient: Redis | null = null;

const BASE_REDIS_OPTIONS: RedisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times: number) {
    return Math.min(times * 50, 2000);
  },
  enableOfflineQueue: true,
  keepAlive: 10000,
};

function buildConnectionOptions() {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  return BASE_REDIS_OPTIONS;
}

function registerRedisEvents(client: Redis, name: string) {
  client.on('connect', () => {
    console.info(`Redis ${name} connected`);
  });
  client.on('ready', () => {
    console.info(`Redis ${name} ready`);
  });
  client.on('error', (error) => {
    console.error(`Redis ${name} error`, error);
  });
  client.on('close', () => {
    console.warn(`Redis ${name} closed`);
  });
  client.on('reconnecting', () => {
    console.info(`Redis ${name} reconnecting`);
  });
}

export function createRedisClient(): Redis {
  const connectionOptions = buildConnectionOptions();
  const client = typeof connectionOptions === 'string'
    ? new Redis(connectionOptions)
    : new Redis(connectionOptions);
  registerRedisEvents(client, 'client');
  return client;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

export function getRedisPubClient(): Redis {
  if (!pubClient) {
    pubClient = createRedisClient();
  }
  return pubClient;
}

export function getRedisSubClient(): Redis {
  if (!subClient) {
    subClient = createRedisClient();
  }
  return subClient;
}

export function getSocketRedisAdapter() {
  const publisher = getRedisPubClient();
  const subscriber = getRedisSubClient();
  return createAdapter(publisher, subscriber);
}

export async function connectRedis() {
  const clients = [getRedisClient(), getRedisPubClient(), getRedisSubClient()];
  await Promise.all(clients.map((client) => client.connect().catch(() => null)));
}

export async function disconnectRedis() {
  await Promise.all([
    redisClient?.quit(),
    pubClient?.quit(),
    subClient?.quit(),
  ].filter(Boolean));
  redisClient = null;
  pubClient = null;
  subClient = null;
}

export async function setCache(key: string, value: unknown, ttlSeconds?: number) {
  const redis = getRedisClient();
  const raw = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.set(key, raw, 'EX', ttlSeconds);
  } else {
    await redis.set(key, raw);
  }
}

export async function getCache<T = unknown>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function deleteCache(key: string) {
  const redis = getRedisClient();
  await redis.del(key);
}

export async function getCacheTTL(key: string) {
  const redis = getRedisClient();
  return redis.ttl(key);
}
