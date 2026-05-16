// GET /api/profile/[username] - Get user profile by username
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ username }, { projection: { password: 0 } });
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  return NextResponse.json({ success: true, user });
}
