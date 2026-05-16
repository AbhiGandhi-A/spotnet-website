// GET /api/friends/suggestions - Friend suggestions (stub)
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/middleware/auth';

export const GET = withAuth(async (req: NextRequest) => {
  // TODO: Implement friend suggestion logic
  return NextResponse.json({ success: true, suggestions: [] });
});
