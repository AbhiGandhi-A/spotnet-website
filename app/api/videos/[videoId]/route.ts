// DELETE /api/videos/[videoId] - Delete video (stub, integrate R2)
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';

export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { videoId: string } }) => {
  // TODO: Integrate R2 deletion
  return NextResponse.json({ success: true });
});
