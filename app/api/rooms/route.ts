import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/middleware/auth';

// Create room
export const POST = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const { name, privacy } = await req.json();
  const hostId = (req as any).user.id;
  if (!name || !privacy) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
  const room = {
    name,
    privacy,
    hostId,
    members: [hostId],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await db.collection('rooms').insertOne(room);
  return NextResponse.json({ success: true, roomId: result.insertedId });
});
