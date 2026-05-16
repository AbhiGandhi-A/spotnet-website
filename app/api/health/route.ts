// Health check API
import { NextResponse } from 'next/server';
import { getHealthMetrics } from '@/lib/metrics';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  const redis = getRedisClient();
  const redisStatus = redis.status || 'unknown';
  const metrics = getHealthMetrics();
  return NextResponse.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: { status: redisStatus },
    metrics,
  });
}
