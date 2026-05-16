import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getLoginHistory } from '@/services/securityService';

export const GET = withAuth(async (req: NextRequest) => {
  const user = (req as any).user;
  if (!user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const history = await getLoginHistory(user.id, 50);
  return NextResponse.json({ success: true, history });
});
