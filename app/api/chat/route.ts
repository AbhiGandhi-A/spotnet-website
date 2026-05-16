import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/middleware/auth';

// Get chat messages for a room (roomId in query)
export const GET = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const { roomId } = Object.fromEntries(new URL(req.url).searchParams.entries());
  if (!roomId) return NextResponse.json({ success: false, error: 'Missing roomId' }, { status: 400 });
  const messages = await db.collection('chatMessages').find({ roomId }).toArray();
  return NextResponse.json({ success: true, messages });
});
