// POST /api/rooms/[roomId]/invite-link - Generate invite link (stub)
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest) => {
  // TODO: Implement invite link generation
  return NextResponse.json({ success: true, link: 'https://spotnet.app/invite/abc123' });
});
