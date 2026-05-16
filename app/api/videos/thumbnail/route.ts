// POST /api/videos/thumbnail - Upload video thumbnail (stub, integrate R2)
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (req: NextRequest) => {
  // TODO: Integrate R2 thumbnail upload
  return NextResponse.json({ success: true, url: 'https://r2.example.com/thumbnail.jpg' });
});
