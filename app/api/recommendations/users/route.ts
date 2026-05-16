import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getRecommendedUsers, getRecentlyActiveFriends } from '@/services/recommendationService';

export const GET = withAuth(async (req: NextRequest) => {
  const user = (req as any).user;
  if (!user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const [recommendations, activeFriends] = await Promise.all([
    getRecommendedUsers(user.id),
    getRecentlyActiveFriends(user.id),
  ]);

  return NextResponse.json({ success: true, recommendations, activeFriends });
});
