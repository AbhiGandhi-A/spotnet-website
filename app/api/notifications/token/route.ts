import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { registerDeviceToken } from '@/lib/fcm';

export const POST = withAuth(async (req: NextRequest) => {
  const user = (req as any).user;
  if (!user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { deviceToken, platform, deviceId } = body;
  if (!deviceToken || !platform || !deviceId) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }

  await registerDeviceToken(user.id, deviceToken, { platform, deviceId });
  return NextResponse.json({ success: true, registered: true });
});
