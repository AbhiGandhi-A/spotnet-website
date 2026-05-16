import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/middleware/auth';

// GET /api/friends - List friends
export const GET = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const userId = (req as any).user.id;
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const friends = await db.collection('users').find({ _id: { $in: user.friends || [] } }, { projection: { password: 0 } }).toArray();
  return NextResponse.json({ success: true, friends });
});

// Send friend request
export const POST = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const { toUserId } = await req.json();
  const fromUserId = (req as any).user.id;
  if (!toUserId) return NextResponse.json({ success: false, error: 'Missing toUserId' }, { status: 400 });
  if (fromUserId === toUserId) return NextResponse.json({ success: false, error: 'Cannot friend yourself' }, { status: 400 });
  const existing = await db.collection('friendRequests').findOne({ fromUserId, toUserId });
  if (existing) return NextResponse.json({ success: false, error: 'Request already sent' }, { status: 409 });
  await db.collection('friendRequests').insertOne({ fromUserId, toUserId, status: 'PENDING', createdAt: new Date(), updatedAt: new Date() });
  return NextResponse.json({ success: true });
});
