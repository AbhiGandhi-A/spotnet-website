// GET /api/rooms/recent - List recent rooms
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  const { db } = await connectToDatabase();
  const rooms = await db.collection('rooms').find({ privacy: 'PUBLIC' }).sort({ createdAt: -1 }).limit(10).toArray();
  return NextResponse.json({ success: true, rooms });
}
