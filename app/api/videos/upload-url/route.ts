// POST /api/videos/upload-url - Get signed upload URL for Cloudflare R2 (stub)
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest) => {
  // TODO: Implement signed URL generation for R2
  return NextResponse.json({ success: true, url: 'https://r2.example.com/upload-url' });
});
