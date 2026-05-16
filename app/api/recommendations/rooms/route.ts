import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getRecommendedRooms } from '@/services/recommendationService';

export const GET = withAuth(async (req: NextRequest) => {
  const user = (req as any).user;
  if (!user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const recommendations = await getRecommendedRooms(user.id);
  return NextResponse.json({ success: true, recommendations });
});
