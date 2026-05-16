// PATCH /api/profile/update - Update user profile
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/middleware/auth';

export const PATCH = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const userId = (req as any).user.id;
  const updates = await req.json();
  await db.collection('users').updateOne({ _id: userId }, { $set: updates });
  return NextResponse.json({ success: true });
});
