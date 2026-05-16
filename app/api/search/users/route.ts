// GET /api/search/users - Search users
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const { db } = await connectToDatabase();
  const { q } = Object.fromEntries(new URL(req.url).searchParams.entries());
  if (!q) return NextResponse.json({ success: false, error: 'Missing query' }, { status: 400 });
  const users = await db.collection('users').find({
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } }
    ]
  }, { projection: { password: 0 } }).toArray();
  return NextResponse.json({ success: true, users });
}
