// POST /api/chat/send - Send a chat message
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const { roomId, content, replyTo } = await req.json();
  const senderId = (req as any).user.id;
  if (!roomId || !content) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
  const message = {
    roomId,
    senderId,
    content,
    replyTo,
    createdAt: new Date(),
    edited: false,
    reactions: [],
    readBy: [senderId],
  };
  const result = await db.collection('chatMessages').insertOne(message);
  return NextResponse.json({ success: true, messageId: result.insertedId });
});
