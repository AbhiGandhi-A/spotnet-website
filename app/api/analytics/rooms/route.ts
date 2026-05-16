import { NextResponse } from 'next/server';
import { getRoomAnalytics, getTrendingRooms, getWatchDurationAnalytics, getPeakUsage } from '@/services/analyticsService';

export async function GET() {
  const [analytics, trending, peakUsage] = await Promise.all([
    getRoomAnalytics(),
    getTrendingRooms(),
    getPeakUsage(),
  ]);

  return NextResponse.json({
    success: true,
    analytics,
    trending,
    peakUsage,
  });
}
