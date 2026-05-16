// PATCH /api/notifications/read - Mark notifications as read
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/middleware/auth';

export const PATCH = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const { notificationIds } = await req.json();
  if (!notificationIds || !Array.isArray(notificationIds)) return NextResponse.json({ success: false, error: 'Missing notificationIds' }, { status: 400 });
  await db.collection('notifications').updateMany({ _id: { $in: notificationIds } }, { $set: { read: true } });
  return NextResponse.json({ success: true });
});
