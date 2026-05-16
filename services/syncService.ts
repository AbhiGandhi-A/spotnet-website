import { getRedisClient } from '@/lib/redis';

export interface PlaybackState {
  roomId: string;
  hostId: string;
  position: number;
  playing: boolean;
  speed: number;
  buffering: boolean;
  timestamp: number;
  subtitleTrack?: string;
  deviceStates?: Record<string, { position: number; latencyMs: number; buffering: boolean }>;
}

const ROOM_STATE_PREFIX = 'room:state:';

export function getRoomStateKey(roomId: string) {
  return `${ROOM_STATE_PREFIX}${roomId}`;
}

export async function getCachedPlaybackState(roomId: string): Promise<PlaybackState | null> {
  const redis = getRedisClient();
  const payload = await redis.get(getRoomStateKey(roomId));
  if (!payload) return null;
  try {
    return JSON.parse(payload) as PlaybackState;
  } catch {
    return null;
  }
}

export async function setCachedPlaybackState(roomId: string, state: PlaybackState, ttlSeconds = 120) {
  const redis = getRedisClient();
  await redis.set(getRoomStateKey(roomId), JSON.stringify(state), 'EX', ttlSeconds);
}

export async function invalidatePlaybackState(roomId: string) {
  const redis = getRedisClient();
  await redis.del(getRoomStateKey(roomId));
}

export function reconcilePlaybackState(currentState: PlaybackState, update: Partial<PlaybackState>) {
  const nextState: PlaybackState = {
    ...currentState,
    ...update,
    timestamp: Date.now(),
    deviceStates: {
      ...(currentState.deviceStates || {}),
      ...(update.deviceStates || {}),
    },
  };
  return nextState;
}

export function calculateDrift(hostPosition: number, clientPosition: number) {
  return Math.abs(hostPosition - clientPosition);
}

export function shouldResync(driftMs: number) {
  return driftMs > 1500;
}
