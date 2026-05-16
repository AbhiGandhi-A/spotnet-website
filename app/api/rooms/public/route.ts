// GET /api/rooms/public - List public rooms
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  const { db } = await connectToDatabase();
  const rooms = await db.collection('rooms').find({ privacy: 'PUBLIC' }).toArray();
  return NextResponse.json({ success: true, rooms });
}
