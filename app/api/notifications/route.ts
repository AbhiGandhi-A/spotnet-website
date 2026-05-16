import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/middleware/auth';

// Get notifications for current user
export const GET = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const userId = (req as any).user.id;
  const notifications = await db.collection('notifications').find({ userId }).toArray();
  return NextResponse.json({ success: true, notifications });
});
