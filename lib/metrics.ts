import { performance } from 'perf_hooks';

interface MetricsState {
  requestCount: number;
  errorCount: number;
  socketEventCount: number;
  lastRequestAt?: string;
  lastErrorAt?: string;
  totalRequestTimeMs: number;
  activeRoomCount: number;
}

const metrics: MetricsState = {
  requestCount: 0,
  errorCount: 0,
  socketEventCount: 0,
  totalRequestTimeMs: 0,
  activeRoomCount: 0,
};

export function recordRequestMetric(durationMs: number) {
  metrics.requestCount += 1;
  metrics.lastRequestAt = new Date().toISOString();
  metrics.totalRequestTimeMs += durationMs;
}

export function recordErrorMetric() {
  metrics.errorCount += 1;
  metrics.lastErrorAt = new Date().toISOString();
}

export function recordSocketEvent() {
  metrics.socketEventCount += 1;
}

export function setActiveRoomCount(count: number) {
  metrics.activeRoomCount = count;
}

export function getHealthMetrics() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    memoryUsage: process.memoryUsage(),
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    averageRequestMs: metrics.requestCount ? metrics.totalRequestTimeMs / metrics.requestCount : 0,
    socketEventCount: metrics.socketEventCount,
    activeRoomCount: metrics.activeRoomCount,
    nodeVersion: process.version,
  };
}

export async function profileRequest<T>(fn: () => Promise<T>) {
  const start = performance.now();
  const result = await fn();
  recordRequestMetric(performance.now() - start);
  return result;
}
