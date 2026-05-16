import { connectToDatabase } from '@/lib/mongodb';
import { addQueueJob, notificationQueue } from '@/lib/queue';
import { getDeviceTokens, sendFcmNotification } from '@/lib/fcm';

export async function queueNotificationDelivery(userId: string, payload: { title: string; body: string; data?: Record<string, string> }) {
  return addQueueJob(notificationQueue, 'send-notification', { userId, payload }, { attempts: 4, backoff: { type: 'exponential', delay: 3000 } });
}

export async function createNotification(userId: string, type: string, data: any) {
  const { db } = await connectToDatabase();
  const notification = {
    userId,
    type,
    data,
    read: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection('notifications').insertOne(notification);
  return notification;
}

export async function deliverNotification(userId: string, title: string, body: string, data: Record<string, string> = {}) {
  await createNotification(userId, 'push', { title, body, ...data });
  const tokens = await getDeviceTokens(userId);
  await Promise.all(tokens.map((tokenRecord) => sendFcmNotification(tokenRecord.token, title, body, data)));
}
