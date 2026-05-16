// Health check API
import { NextResponse } from 'next/server';
import { getHealthMetrics } from '@/lib/metrics';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  let redisStatus = 'unknown';
  try {
    const redis = getRedisClient();
    redisStatus = redis.status || 'unknown';
  } catch (error) {
    redisStatus = 'unavailable';
  }

  const metrics = getHealthMetrics();
  return NextResponse.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: { status: redisStatus },
    metrics,
  });
}
