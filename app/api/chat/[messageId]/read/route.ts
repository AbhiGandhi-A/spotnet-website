// POST /api/chat/[messageId]/read - Mark message as read
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest, { params }: { params: { messageId: string } }) => {
  const { db } = await connectToDatabase();
  const userId = (req as any).user.id;
  await db.collection('chatMessages').updateOne(
    { _id: new ObjectId(params.messageId) },
    { $addToSet: { readBy: userId } }
  );
  return NextResponse.json({ success: true });
});
