import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function recordAuditLog(action: string, performedBy: string, targetType: string, targetId: string, details: any = {}) {
  const { db } = await connectToDatabase();
  await db.collection('auditLogs').insertOne({
    action,
    performedBy,
    targetType,
    targetId,
    details,
    createdAt: new Date(),
  });
}

export async function banUser(userId: string, moderatorId: string, reason: string) {
  const { db } = await connectToDatabase();
  await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { banned: true, bannedAt: new Date(), banReason: reason } });
  await recordAuditLog('ban_user', moderatorId, 'user', userId, { reason });
}

export async function muteUser(roomId: string, userId: string, moderatorId: string, durationMinutes: number) {
  const { db } = await connectToDatabase();
  const muteExpires = new Date(Date.now() + durationMinutes * 60 * 1000);
  await db.collection('roomModeration').updateOne(
    { roomId: new ObjectId(roomId), userId: new ObjectId(userId) },
    {
      $set: {
        muted: true,
        muteExpires,
        moderatorId: new ObjectId(moderatorId),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
  await recordAuditLog('mute_user', moderatorId, 'room', roomId, { userId, muteExpires });
}

export async function reportUser(reporterId: string, reportedId: string, reason: string) {
  const { db } = await connectToDatabase();
  await db.collection('reports').insertOne({
    reporterId: new ObjectId(reporterId),
    reportedId: new ObjectId(reportedId),
    reason,
    status: 'OPEN',
    createdAt: new Date(),
  });
}

export async function pinMessage(roomId: string, messageId: string, userId: string) {
  const { db } = await connectToDatabase();
  await db.collection('rooms').updateOne(
    { _id: new ObjectId(roomId) },
    {
      $set: {
        pinnedMessage: new ObjectId(messageId),
        pinnedBy: new ObjectId(userId),
        pinnedAt: new Date(),
      },
    }
  );
  await recordAuditLog('pin_message', userId, 'room', roomId, { messageId });
}
