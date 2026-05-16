// POST /api/notifications/send - Send a notification
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const { userId, type, data } = await req.json();
  if (!userId || !type) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
  const notification = {
    userId,
    type,
    data,
    read: false,
    createdAt: new Date(),
  };
  await db.collection('notifications').insertOne(notification);
  return NextResponse.json({ success: true });
});
