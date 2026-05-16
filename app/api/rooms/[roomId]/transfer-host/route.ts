// POST /api/rooms/[roomId]/transfer-host - Transfer host permissions
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest, { params }: { params: { roomId: string } }) => {
  const { db } = await connectToDatabase();
  const { newHostId } = await req.json();
  const userId = (req as any).user.id;
  const roomId = params.roomId;
  const room = await db.collection('rooms').findOne({ _id: new ObjectId(roomId) });
  if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
  if (room.hostId !== userId) return NextResponse.json({ success: false, error: 'Only host can transfer' }, { status: 403 });
  await db.collection('rooms').updateOne({ _id: new ObjectId(roomId) }, { $set: { hostId: newHostId } });
  return NextResponse.json({ success: true });
});
