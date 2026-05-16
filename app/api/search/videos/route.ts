// GET /api/search/videos - Search videos
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const { db } = await connectToDatabase();
  const { q } = Object.fromEntries(new URL(req.url).searchParams.entries());
  if (!q) return NextResponse.json({ success: false, error: 'Missing query' }, { status: 400 });
  const videos = await db.collection('videos').find({ title: { $regex: q, $options: 'i' } }).toArray();
  return NextResponse.json({ success: true, videos });
}
