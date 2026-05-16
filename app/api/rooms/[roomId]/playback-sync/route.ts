// POST /api/rooms/[roomId]/playback-sync - Video playback sync event (stub)
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest) => {
  // TODO: Implement playback sync logic
  return NextResponse.json({ success: true });
});
