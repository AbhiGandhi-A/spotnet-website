// DELETE /api/friends/[friendId] - Remove a friend
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/middleware/auth';

export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { friendId: string } }) => {
  const { db } = await connectToDatabase();
  const userId = (req as any).user.id;
  const friendId = params.friendId;
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { friends: new ObjectId(friendId) } } as any
  );
  await db.collection('users').updateOne(
    { _id: new ObjectId(friendId) },
    { $pull: { friends: new ObjectId(userId) } } as any
  );
  return NextResponse.json({ success: true });
});
