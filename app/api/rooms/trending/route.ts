// GET /api/rooms/trending - List trending rooms (stub, implement aggregation later)
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  const { db } = await connectToDatabase();
  // TODO: Implement trending aggregation
  const rooms = await db.collection('rooms').find({ privacy: 'PUBLIC' }).sort({ memberCount: -1 }).limit(10).toArray();
  return NextResponse.json({ success: true, rooms });
}
