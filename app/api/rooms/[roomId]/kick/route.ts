// POST /api/rooms/[roomId]/kick - Kick user from room (stub)
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest) => {
  // TODO: Implement kick logic
  return NextResponse.json({ success: true });
});
