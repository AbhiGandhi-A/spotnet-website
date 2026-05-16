// GET /api/friends/requests - List friend requests
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/middleware/auth';

export const GET = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const userId = (req as any).user.id;
  const requests = await db.collection('friendRequests').find({ toUserId: userId, status: 'PENDING' }).toArray();
  return NextResponse.json({ success: true, requests });
});
