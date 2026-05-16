import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/middleware/auth';

// PATCH /api/chat/[messageId] - Edit a chat message
export const PATCH = withAuth(async (req: NextRequest, { params }: { params: { messageId: string } }) => {
  const { db } = await connectToDatabase();
  const messageId = params.messageId;
  const userId = (req as any).user.id;
  const { content } = await req.json();
  const message = await db.collection('chatMessages').findOne({ _id: new ObjectId(messageId) });
  if (!message) return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
  if (message.senderId !== userId) return NextResponse.json({ success: false, error: 'Not your message' }, { status: 403 });
  await db.collection('chatMessages').updateOne({ _id: new ObjectId(messageId) }, { $set: { content, edited: true } });
  return NextResponse.json({ success: true });
});

// DELETE /api/chat/[messageId] - Delete a chat message
export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { messageId: string } }) => {
  const { db } = await connectToDatabase();
  const messageId = params.messageId;
  const userId = (req as any).user.id;
  const message = await db.collection('chatMessages').findOne({ _id: new ObjectId(messageId) });
  if (!message) return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
  if (message.senderId !== userId) return NextResponse.json({ success: false, error: 'Not your message' }, { status: 403 });
  await db.collection('chatMessages').deleteOne({ _id: new ObjectId(messageId) });
  return NextResponse.json({ success: true });
});
