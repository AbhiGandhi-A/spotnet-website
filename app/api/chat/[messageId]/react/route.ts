// POST /api/chat/[messageId]/react - Add emoji reaction to a chat message
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest, { params }: { params: { messageId: string } }) => {
  const { db } = await connectToDatabase();
  const { emoji } = await req.json();
  const userId = (req as any).user.id;
  if (!emoji) return NextResponse.json({ success: false, error: 'Missing emoji' }, { status: 400 });
  await db.collection('chatMessages').updateOne(
    { _id: new ObjectId(params.messageId) },
    { $addToSet: { reactions: { userId, emoji } } }
  );
  return NextResponse.json({ success: true });
});
