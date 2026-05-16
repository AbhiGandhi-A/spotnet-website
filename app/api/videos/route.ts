import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/middleware/auth';

// Upload video metadata (Cloudflare R2 upload handled separately)
export const POST = withAuth(async (req: NextRequest) => {
  const { db } = await connectToDatabase();
  const { url, title, thumbnail, description } = await req.json();
  const uploaderId = (req as any).user.id;
  if (!url || !title) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
  const video = {
    url,
    title,
    thumbnail,
    description,
    uploaderId,
    uploadedAt: new Date(),
  };
  const result = await db.collection('videos').insertOne(video);
  return NextResponse.json({ success: true, videoId: result.insertedId });
});
