// POST /api/profile/avatar - Upload profile image (stub, integrate R2)
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest) => {
  // TODO: Integrate Cloudflare R2 upload
  return NextResponse.json({ success: true, url: 'https://r2.example.com/profile.jpg' });
});
