// POST /api/rooms/[roomId]/invite - Invite user to room (stub)
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest) => {
  // TODO: Implement invite logic
  return NextResponse.json({ success: true });
});
