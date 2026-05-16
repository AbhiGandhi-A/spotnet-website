// GET /api/rooms/[roomId] - Get room details
// PATCH /api/rooms/[roomId] - Update room
// DELETE /api/rooms/[roomId] - Delete room
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/middleware/auth';

export const GET = withAuth(async (req: NextRequest, { params }: { params: { roomId: string } }) => {
  const { db } = await connectToDatabase();
  const room = await db.collection('rooms').findOne({ _id: new ObjectId(params.roomId) });
  if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
  return NextResponse.json({ success: true, room });
});

export const PATCH = withAuth(async (req: NextRequest, { params }: { params: { roomId: string } }) => {
  const { db } = await connectToDatabase();
  const updates = await req.json();
  const result = await db.collection('rooms').updateOne({ _id: new ObjectId(params.roomId) }, { $set: updates });
  if (!result.modifiedCount) return NextResponse.json({ success: false, error: 'Update failed' }, { status: 400 });
  return NextResponse.json({ success: true });
});

export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { roomId: string } }) => {
  const { db } = await connectToDatabase();
  const result = await db.collection('rooms').deleteOne({ _id: new ObjectId(params.roomId) });
  if (!result.deletedCount) return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 400 });
  return NextResponse.json({ success: true });
});
