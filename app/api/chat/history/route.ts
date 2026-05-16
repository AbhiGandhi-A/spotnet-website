// GET /api/chat/history - Paginated chat history for a room
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/middleware/auth';

export const GET = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const { roomId, page = 1, limit = 50 } = Object.fromEntries(new URL(req.url).searchParams.entries());
  if (!roomId) return NextResponse.json({ success: false, error: 'Missing roomId' }, { status: 400 });
  const skip = (Number(page) - 1) * Number(limit);
  const messages = await db.collection('chatMessages')
    .find({ roomId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .toArray();
  return NextResponse.json({ success: true, messages });
});
