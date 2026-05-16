// POST /api/chat/[messageId]/reply - Reply to a chat message
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest, { params }: { params: { messageId: string } }) => {
  const { db } = await connectToDatabase();
  const { content } = await req.json();
  const senderId = (req as any).user.id;
  if (!content) return NextResponse.json({ success: false, error: 'Missing content' }, { status: 400 });
  const parentMessage = await db.collection('chatMessages').findOne({ _id: new ObjectId(params.messageId) });
  if (!parentMessage) return NextResponse.json({ success: false, error: 'Parent message not found' }, { status: 404 });
  const reply = {
    roomId: parentMessage.roomId,
    senderId,
    content,
    replyTo: params.messageId,
    createdAt: new Date(),
    edited: false,
    reactions: [],
    readBy: [senderId],
  };
  const result = await db.collection('chatMessages').insertOne(reply);
  return NextResponse.json({ success: true, messageId: result.insertedId });
});
