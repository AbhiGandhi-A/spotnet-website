// POST /api/friends/reject - Reject a friend request
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const { requestId } = await req.json();
  const userId = (req as any).user.id;
  const request = await db.collection('friendRequests').findOne({ _id: new ObjectId(requestId), toUserId: userId, status: 'PENDING' });
  if (!request) return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
  await db.collection('friendRequests').updateOne({ _id: new ObjectId(requestId) }, { $set: { status: 'REJECTED', updatedAt: new Date() } });
  return NextResponse.json({ success: true });
});
