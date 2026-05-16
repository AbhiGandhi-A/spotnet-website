// GET /api/search/rooms - Search rooms
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const { db } = await connectToDatabase();
  const { q } = Object.fromEntries(new URL(req.url).searchParams.entries());
  if (!q) return NextResponse.json({ success: false, error: 'Missing query' }, { status: 400 });
  const rooms = await db.collection('rooms').find({ name: { $regex: q, $options: 'i' } }).toArray();
  return NextResponse.json({ success: true, rooms });
}
