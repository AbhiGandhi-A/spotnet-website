import { NextResponse } from 'next/server';
import { getUserAnalytics, getActiveUsersAnalytics, getRetentionAnalytics } from '@/services/analyticsService';

export async function GET() {
  const [users, activeUsers, retention] = await Promise.all([
    getUserAnalytics(),
    getActiveUsersAnalytics(),
    getRetentionAnalytics(30),
  ]);

  return NextResponse.json({
    success: true,
    users,
    activeUsers,
    retention,
  });
}
