import admin from 'firebase-admin';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

function initializeFcm() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Missing Firebase service account environment variables');
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin.messaging();
}

export async function sendFcmNotification(token: string, title: string, body: string, data: Record<string, string> = {}) {
  const messaging = initializeFcm();
  const message: admin.messaging.Message = {
    token,
    notification: { title, body },
    data,
    android: { priority: 'high', notification: { sound: 'default' } },
    apns: { headers: { 'apns-priority': '10' } },
  };
  return messaging.send(message);
}

export async function sendSilentNotification(token: string, data: Record<string, string> = {}) {
  const messaging = initializeFcm();
  const message: admin.messaging.Message = {
    token,
    data,
    android: { priority: 'high', notification: { sound: 'default' } },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: { aps: { contentAvailable: true } },
    },
  };
  return messaging.send(message);
}

export async function registerDeviceToken(userId: string, deviceToken: string, deviceInfo: { platform: string; deviceId: string }) {
  const { db } = await connectToDatabase();
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: { updatedAt: new Date() },
      $addToSet: {
        deviceTokens: {
          token: deviceToken,
          platform: deviceInfo.platform,
          deviceId: deviceInfo.deviceId,
          updatedAt: new Date(),
        },
      },
    },
    { upsert: true }
  );
}

export async function removeDeviceToken(userId: string, deviceToken: string) {
  const { db } = await connectToDatabase();
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { deviceTokens: { token: deviceToken } } as any }
  );
}

export async function getDeviceTokens(userId: string) {
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { deviceTokens: 1 } });
  return (user?.deviceTokens || []) as Array<{ token: string; platform: string; deviceId: string }>;
}
