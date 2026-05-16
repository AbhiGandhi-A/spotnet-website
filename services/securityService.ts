import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function recordSecurityEvent(userId: string, action: string, details: any = {}) {
  const { db } = await connectToDatabase();
  await db.collection('securityEvents').insertOne({
    userId: new ObjectId(userId),
    action,
    details,
    createdAt: new Date(),
  });
}

export async function getLoginHistory(userId: string, limit = 50) {
  const { db } = await connectToDatabase();
  return db.collection('securityEvents')
    .find({ userId: new ObjectId(userId), action: { $in: ['login_success', 'login_failed', 'token_rotated'] } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function revokeUserSessions(userId: string) {
  const { db } = await connectToDatabase();
  const update = { $set: { active: false, revokedAt: new Date() } };
  await db.collection('sessions').updateMany({ userId: new ObjectId(userId), active: true }, update);
  await recordSecurityEvent(userId, 'sessions_revoked', {});
}

export async function getSecurityLogs(userId: string, limit = 50) {
  const { db } = await connectToDatabase();
  return db.collection('securityEvents')
    .find({ userId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
