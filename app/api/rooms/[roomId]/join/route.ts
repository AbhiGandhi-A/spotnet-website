// POST /api/rooms/[roomId]/join - Join a room
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest, { params }: { params: { roomId: string } }) => {
  const { db } = await connectToDatabase();
  const userId = (req as any).user.id;
  const roomId = params.roomId;
  const room = await db.collection('rooms').findOne({ _id: new ObjectId(roomId) });
  if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
  if (room.members.includes(userId)) return NextResponse.json({ success: false, error: 'Already a member' }, { status: 409 });
  await db.collection('rooms').updateOne({ _id: new ObjectId(roomId) }, { $addToSet: { members: userId } });
  return NextResponse.json({ success: true });
});
