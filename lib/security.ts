import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { getRedisClient } from '@/lib/redis';

const REFRESH_PREFIX = 'auth:refresh:';
const TOKEN_BLOCK_PREFIX = 'auth:block:';
const LOGIN_ATTEMPT_PREFIX = 'security:login:';
const BLOCKED_IP_PREFIX = 'security:block:ip:';
const DEFAULT_REFRESH_TTL = 60 * 60 * 24 * 14;

export function signAuthToken(payload: object, expiresIn = '15m') {
  return jwt.sign(payload, process.env.JWT_SECRET as jwt.Secret, { expiresIn, jwtid: crypto.randomUUID() } as jwt.SignOptions);
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
}

export async function issueRefreshToken(userId: string, sessionId: string) {
  const redis = getRedisClient();
  const token = crypto.randomUUID();
  const key = `${REFRESH_PREFIX}${token}`;
  await redis.set(key, JSON.stringify({ userId, sessionId, createdAt: Date.now() }), 'EX', DEFAULT_REFRESH_TTL);
  return token;
}

export async function validateRefreshToken(token: string) {
  const redis = getRedisClient();
  const key = `${REFRESH_PREFIX}${token}`;
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as { userId: string; sessionId: string; createdAt: number };
}

export async function revokeRefreshToken(token: string) {
  const redis = getRedisClient();
  const key = `${REFRESH_PREFIX}${token}`;
  await redis.del(key);
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  const redis = getRedisClient();
  const keys = await redis.keys(`${REFRESH_PREFIX}*`);
  const pipelines = redis.multi();
  for (const key of keys) {
    const value = await redis.get(key);
    if (!value) continue;
    const parsed = JSON.parse(value) as { userId: string };
    if (parsed.userId === userId) {
      pipelines.del(key);
    }
  }
  await pipelines.exec();
}

export async function rotateAuthToken(oldToken: string, payload: object) {
  try {
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET as string, { ignoreExpiration: true }) as JwtPayload;
    if (decoded?.jti) {
      await blockToken(decoded.jti as string);
    }
  } catch {
    // continue even if old token invalid
  }
  return signAuthToken(payload);
}

export async function blockToken(tokenId: string, ttlSeconds = 60 * 60) {
  const redis = getRedisClient();
  await redis.set(`${TOKEN_BLOCK_PREFIX}${tokenId}`, '1', 'EX', ttlSeconds);
}

export async function isTokenBlocked(tokenId: string) {
  const redis = getRedisClient();
  return (await redis.exists(`${TOKEN_BLOCK_PREFIX}${tokenId}`)) > 0;
}

export async function recordFailedLoginAttempt(ip: string, userId?: string) {
  const redis = getRedisClient();
  const key = `${LOGIN_ATTEMPT_PREFIX}${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60 * 15);
  }
  if (count >= 12) {
    await redis.set(`${BLOCKED_IP_PREFIX}${ip}`, '1', 'EX', 60 * 15);
  }
  if (count >= 20) {
    await revokeAllRefreshTokensForUser(userId || '');
  }
  return count;
}

export async function isIpBlocked(ip: string) {
  const redis = getRedisClient();
  return (await redis.exists(`${BLOCKED_IP_PREFIX}${ip}`)) > 0;
}
