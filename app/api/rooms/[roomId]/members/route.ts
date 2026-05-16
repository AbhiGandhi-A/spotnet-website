// GET /api/rooms/[roomId]/members - Get room members
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/middleware/auth';

export const GET = withAuth(async (req: NextRequest, { params }: { params: { roomId: string } }) => {
  const { db } = await connectToDatabase();
  const roomId = params.roomId;
  const room = await db.collection('rooms').findOne({ _id: new ObjectId(roomId) });
  if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
  const members = await db.collection('users').find({ _id: { $in: room.members || [] } }, { projection: { password: 0 } }).toArray();
  return NextResponse.json({ success: true, members });
});
