import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/mongodb';
import { getRedisClient } from '@/lib/redis';
import { NextRequest } from 'next/server';

const accessSecret = process.env.JWT_SECRET!;
const refreshSecret = process.env.JWT_REFRESH_SECRET!;
const accessExpire = process.env.JWT_EXPIRES_IN || '15m';
const refreshExpire = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface SessionPayload {
  id: string;
  sessionId: string;
  deviceFingerprint?: string;
}

export async function signAccessToken(payload: object) {
  return jwt.sign(payload, accessSecret as jwt.Secret, { expiresIn: accessExpire } as jwt.SignOptions);
}

export async function signRefreshToken(payload: object) {
  return jwt.sign(payload, refreshSecret as jwt.Secret, { expiresIn: refreshExpire } as jwt.SignOptions);
}

export async function verifyAccessToken(token: string) {
  return jwt.verify(token, accessSecret) as JwtPayload;
}

export async function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret) as JwtPayload;
}

export async function createSession(userId: string, fingerprint: string, ip: string) {
  const sessionId = uuidv4();
  const now = new Date();
  const { db } = await connectToDatabase();
  await db.collection('sessions').insertOne({
    userId,
    sessionId,
    fingerprint,
    ip,
    createdAt: now,
    updatedAt: now,
    revoked: false,
  });
  await getRedisClient().set(`session:${sessionId}`, JSON.stringify({ userId, ip, fingerprint }), 'EX', 60 * 60 * 24 * 7);
  return sessionId;
}

export async function revokeSession(sessionId: string) {
  const { db } = await connectToDatabase();
  await db.collection('sessions').updateOne({ sessionId }, { $set: { revoked: true, updatedAt: new Date() } });
  await getRedisClient().del(`session:${sessionId}`);
}

export async function isSessionRevoked(sessionId: string) {
  const cache = await getRedisClient().get(`session:${sessionId}`);
  if (!cache) {
    const { db } = await connectToDatabase();
    const session = await db.collection('sessions').findOne({ sessionId });
    return !!session?.revoked;
  }
  return false;
}

export async function registerLogin(req: NextRequest) {
  const fingerprint = buildDeviceFingerprint(req);
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  return { fingerprint, ip };
}

export function buildDeviceFingerprint(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const platform = req.headers.get('sec-ch-ua-platform') || 'web';
  return `${platform}:${userAgent}:${ip}`;
}

export async function rotateRefreshToken(oldRefreshToken: string, userId: string) {
  const decoded = await verifyRefreshToken(oldRefreshToken);
  const sessionId = (decoded as any).sessionId || uuidv4();
  if (await isSessionRevoked(sessionId)) {
    throw new Error('Revoked session');
  }
  const refreshToken = await signRefreshToken({ id: userId, sessionId });
  const accessToken = await signAccessToken({ id: userId, sessionId });
  await getRedisClient().set(`refresh:${sessionId}`, refreshToken, 'EX', 60 * 60 * 24 * 7);
  return { accessToken, refreshToken, sessionId };
}
