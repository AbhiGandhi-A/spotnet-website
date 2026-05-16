// POST /api/rooms/[roomId]/ban - Ban user from room (stub)
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest) => {
  // TODO: Implement ban logic
  return NextResponse.json({ success: true });
});
