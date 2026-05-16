import { IncomingMessage, ServerResponse } from 'http';
import { getRedisClient } from '@/lib/redis';
import { logWarn } from '@/utils/logger';

const WINDOW_SECONDS = Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 60);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100);
const BLOCK_SECONDS = Number(process.env.RATE_LIMIT_BLOCK_SECONDS || 300);

function getClientIp(req: IncomingMessage) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

export async function rateLimit(req: IncomingMessage, res: ServerResponse) {
  const redis = getRedisClient();
  const ip = getClientIp(req);
  const key = `rate:${ip}`;
  const blockKey = `rate:block:${ip}`;

  const isBlocked = await redis.exists(blockKey);
  if (isBlocked) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Too many requests. Try again later.' }));
    return false;
  }

  const requests = await redis.incr(key);
  if (requests === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  const ttl = await redis.ttl(key);
  if (requests > MAX_REQUESTS) {
    await redis.set(blockKey, '1', 'EX', BLOCK_SECONDS);
    logWarn('Rate limit exceeded for IP', ip, 'requests', requests);
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Rate limit exceeded. Try again later.' }));
    return false;
  }

  res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - requests)));
  if (ttl > 0) {
    res.setHeader('X-RateLimit-Reset', String(ttl));
  }

  return true;
}
