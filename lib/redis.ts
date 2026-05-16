import Redis, { RedisOptions } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

const REDIS_URL = process.env.REDIS_URL?.trim();
const REDIS_HOST = process.env.REDIS_HOST?.trim();
const REDIS_PORT = process.env.REDIS_PORT?.trim();
const REDIS_CONFIGURED = Boolean(REDIS_URL || REDIS_HOST || REDIS_PORT);

let redisClient: any = null;
let pubClient: any = null;
let subClient: any = null;

const BASE_REDIS_OPTIONS: RedisOptions = {
  host: REDIS_HOST || '127.0.0.1',
  port: Number(REDIS_PORT || 6379),
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times: number) {
    return Math.min(times * 50, 2000);
  },
  enableOfflineQueue: true,
  keepAlive: 10000,
};

function buildConnectionOptions() {
  if (REDIS_URL) {
    return REDIS_URL;
  }
  return BASE_REDIS_OPTIONS;
}

function registerRedisEvents(client: any, name: string) {
  if (!client || !client.on) return;
  client.on('connect', () => {
    console.info(`Redis ${name} connected`);
  });
  client.on('ready', () => {
    console.info(`Redis ${name} ready`);
  });
  client.on('error', (error: any) => {
    console.error(`Redis ${name} error`, error);
  });
  client.on('close', () => {
    console.warn(`Redis ${name} closed`);
  });
  client.on('reconnecting', () => {
    console.info(`Redis ${name} reconnecting`);
  });
}

export function createRedisClient(): any {
  if (!REDIS_CONFIGURED) {
    return null;
  }
  const connectionOptions = buildConnectionOptions();
  const client = typeof connectionOptions === 'string'
    ? new Redis(connectionOptions)
    : new Redis(connectionOptions);
  registerRedisEvents(client, 'client');
  return client;
}

export function getRedisClient(): any {
  if (!REDIS_CONFIGURED) {
    return null;
  }
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

export function getRedisPubClient(): any {
  if (!REDIS_CONFIGURED) {
    return null;
  }
  if (!pubClient) {
    pubClient = createRedisClient();
  }
  return pubClient;
}

export function getRedisSubClient(): any {
  if (!REDIS_CONFIGURED) {
    return null;
  }
  if (!subClient) {
    subClient = createRedisClient();
  }
  return subClient;
}

export function getSocketRedisAdapter() {
  if (!REDIS_CONFIGURED) return undefined;
  const publisher = getRedisPubClient();
  const subscriber = getRedisSubClient();
  return createAdapter(publisher, subscriber);
}

export async function connectRedis() {
  if (!REDIS_CONFIGURED) {
    return;
  }
  const clients = [getRedisClient(), getRedisPubClient(), getRedisSubClient()];
  await Promise.all(clients.map((client) => client?.connect?.().catch(() => null)));
}

export async function disconnectRedis() {
  if (!REDIS_CONFIGURED) {
    redisClient = null;
    pubClient = null;
    subClient = null;
    return;
  }
  await Promise.all([
    redisClient?.quit?.(),
    pubClient?.quit?.(),
    subClient?.quit?.(),
  ].filter(Boolean));
  redisClient = null;
  pubClient = null;
  subClient = null;
}

export async function setCache(key: string, value: unknown, ttlSeconds?: number) {
  const redis = getRedisClient();
  if (!redis) return;
  const raw = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.set(key, raw, 'EX', ttlSeconds);
  } else {
    await redis.set(key, raw);
  }
}

export async function getCache<T = unknown>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
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
  if (!redis) return;
  await redis.del(key);
}

export async function getCacheTTL(key: string) {
  const redis = getRedisClient();
  if (!redis) return -1;
  return redis.ttl(key);
}
