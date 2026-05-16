// GET /api/history/uploads - Get upload history
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/middleware/auth';

export const GET = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const userId = (req as any).user.id;
  const uploads = await db.collection('videos').find({ uploaderId: userId }).sort({ uploadedAt: -1 }).toArray();
  return NextResponse.json({ success: true, uploads });
});
