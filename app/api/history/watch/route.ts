// GET /api/history/watch - Get watch history
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/middleware/auth';

export const GET = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const userId = (req as any).user.id;
  const history = await db.collection('watchHistory').find({ userId }).sort({ watchedAt: -1 }).toArray();
  return NextResponse.json({ success: true, history });
});
