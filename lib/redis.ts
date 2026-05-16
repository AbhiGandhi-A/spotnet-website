import Redis, { RedisOptions } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

const REDIS_ENABLED = Boolean(process.env.REDIS_URL);

let redisClient: any = null;
let pubClient: any = null;
let subClient: any = null;

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

class InMemoryRedis {
  store: Map<string, string> = new Map();
  ttls: Map<string, number> = new Map();
  status = 'ready';

  on() { /* noop */ }
  async connect() { return; }
  async quit() { return; }

  async set(key: string, value: string, mode?: string, ttl?: number) {
    this.store.set(key, value);
    if (mode === 'EX' && typeof ttl === 'number') {
      this.ttls.set(key, Date.now() + ttl * 1000);
    }
    return 'OK';
  }

  async get(key: string) {
    const exp = this.ttls.get(key);
    if (exp && Date.now() > exp) {
      this.store.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.store.get(key) ?? null;
  }

  async keys(pattern: string) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const results: string[] = [];
    for (const k of this.store.keys()) {
      if (regex.test(k)) results.push(k);
    }
    return results;
  }

  async del(key: string) {
    const existed = this.store.delete(key);
    this.ttls.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string) {
    const val = await this.get(key);
    return val ? 1 : 0;
  }

  async incr(key: string) {
    const val = Number((await this.get(key)) || 0) + 1;
    await this.set(key, String(val));
    return val;
  }

  async expire(key: string, seconds: number) {
    if (this.store.has(key)) {
      this.ttls.set(key, Date.now() + seconds * 1000);
      return 1;
    }
    return 0;
  }

  async ttl(key: string) {
    const exp = this.ttls.get(key);
    if (!exp) return -1;
    const remaining = Math.ceil((exp - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }
}

function buildConnectionOptions() {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
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
  if (!REDIS_ENABLED) {
    console.warn('Redis not configured. Using in-memory fallback.');
    return new InMemoryRedis();
  }
  const connectionOptions = buildConnectionOptions();
  const client = typeof connectionOptions === 'string'
    ? new Redis(connectionOptions)
    : new Redis(connectionOptions);
  registerRedisEvents(client, 'client');
  return client;
}

export function getRedisClient(): any {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

export function getRedisPubClient(): any {
  if (!pubClient) {
    pubClient = createRedisClient();
  }
  return pubClient;
}

export function getRedisSubClient(): any {
  if (!subClient) {
    subClient = createRedisClient();
  }
  return subClient;
}

export function getSocketRedisAdapter() {
  if (!REDIS_ENABLED) return undefined;
  const publisher = getRedisPubClient();
  const subscriber = getRedisSubClient();
  return createAdapter(publisher, subscriber);
}

export async function connectRedis() {
  if (!REDIS_ENABLED) {
    console.warn('Redis not configured. Skipping connectRedis.');
    return;
  }
  const clients = [getRedisClient(), getRedisPubClient(), getRedisSubClient()];
  await Promise.all(clients.map((client) => client.connect().catch(() => null)));
}

export async function disconnectRedis() {
  if (!REDIS_ENABLED) {
    redisClient = null;
    pubClient = null;
    subClient = null;
    return;
  }
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
