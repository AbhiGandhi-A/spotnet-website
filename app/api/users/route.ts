import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Get all users or search users
export async function GET(req: NextRequest) {
  const { db } = await connectToDatabase();
  const { search } = Object.fromEntries(new URL(req.url).searchParams.entries());
  const query = search ? {
    $or: [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  } : {};
  const users = await db.collection('users').find(query, { projection: { password: 0 } }).toArray();
  return NextResponse.json({ success: true, users });
}