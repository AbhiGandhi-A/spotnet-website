// POST /api/presence/heartbeat - Presence heartbeat
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const userId = (req as any).user.id;
  await db.collection('users').updateOne({ _id: userId }, { $set: { online: true, lastSeen: new Date() } });
  return NextResponse.json({ success: true });
});
