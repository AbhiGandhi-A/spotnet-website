import { Server as IOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getRedisClient } from '@/lib/redis';
import { getCachedPlaybackState, setCachedPlaybackState, reconcilePlaybackState, calculateDrift, shouldResync } from '@/services/syncService';
import { recordSocketEvent } from '@/lib/metrics';
import { emitToRoom } from '@/utils/socket';

let io: IOServer | null = null;

// Advanced Socket.IO initialization and handlers for playback synchronization.
export function initSocket(server: any) {
  if (!io) {
    io = new IOServer(server, {
      path: process.env.SOCKET_IO_PATH,
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
      },
      pingInterval: Number(process.env.SOCKET_PING_INTERVAL || 25000),
      pingTimeout: Number(process.env.SOCKET_PING_TIMEOUT || 60000),
    });

    // Authentication middleware (stateless JWT). Ensures secure websocket auth.
    io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));
        const user = jwt.verify(token, process.env.JWT_SECRET!);
        (socket as any).user = user;
        return next();
      } catch (err) {
        return next(new Error('Invalid token'));
      }
    });

    io.on('connection', (socket: Socket) => {
      const user = (socket as any).user;
      recordSocketEvent();

      // Track socket sessions in Redis for distributed setups
      const redis = getRedisClient();
      const sessionKey = `socket:session:${socket.id}`;
      redis.set(sessionKey, JSON.stringify({ userId: (user as any).id, connectedAt: Date.now() }), 'EX', 60 * 60 * 24);

      socket.on('join:room', async (payload: { roomId: string }) => {
        const { roomId } = payload || {};
        if (!roomId) return;
        socket.join(roomId);
        // Send authoritative room playback state if exists
        const state = await getCachedPlaybackState(roomId);
        if (state) {
          socket.emit('playback:state', { state, serverTimestamp: Date.now() });
        }
      });

      // Ping/pong for latency measurement used for latency compensation
      socket.on('playback:ping', (clientTs: number) => {
        socket.emit('playback:pong', { clientTs, serverTs: Date.now() });
      });

      socket.on('playback:join', async (data: { roomId: string; position: number; playing: boolean; speed?: number; subtitle?: string; deviceId?: string }) => {
        try {
          const { roomId, position, playing, speed = 1, subtitle, deviceId } = data;
          if (!roomId) return;
          const current = (await getCachedPlaybackState(roomId)) || { roomId, hostId: (user as any).id, position: 0, playing: false, speed: 1, buffering: false, timestamp: Date.now(), deviceStates: {} };
          current.deviceStates = current.deviceStates || {};
          (current.deviceStates as Record<string, { position: number; latencyMs: number; buffering: boolean }>)[deviceId || socket.id] = { position, latencyMs: 0, buffering: false };
          const nextState = reconcilePlaybackState(current, { playing, position, speed, subtitle, timestamp: Date.now() } as any);
          await setCachedPlaybackState(roomId, nextState);
          socket.emit('playback:joined', { state: nextState, serverTimestamp: Date.now() });
        } catch (err) {
          socket.emit('error', { message: 'playback:join failed' });
        }
      });

      // Host-controlled actions: play/pause/seek/speed
      socket.on('playback:control', async (data: { roomId: string; action: 'play' | 'pause' | 'seek' | 'speed'; position?: number; speed?: number; initiatorId?: string }) => {
        const { roomId, action, position, speed } = data;
        if (!roomId) return;
        const state = (await getCachedPlaybackState(roomId)) || null;
        // Host authority: only host may control unless host override flag is set
        const isHost = state ? String(state.hostId) === String((user as any).id) : true;
        if (!isHost && process.env.ALLOW_HOST_OVERRIDE !== 'true') {
          socket.emit('error', { message: 'Not authorized to control playback' });
          return;
        }
        let update: any = {};
        if (action === 'play') update = { playing: true };
        if (action === 'pause') update = { playing: false };
        if (action === 'seek' && typeof position === 'number') update = { position };
        if (action === 'speed' && typeof speed === 'number') update = { speed };
        const next = state ? reconcilePlaybackState(state, update) : ({ roomId, hostId: (user as any).id, position: position || 0, playing: update.playing ?? false, speed: update.speed ?? 1, buffering: false, timestamp: Date.now() } as any);
        await setCachedPlaybackState(roomId, next);
        // Broadcast authoritative state with server timestamp to compensate client latencies
        emitToRoom(io!, roomId, 'playback:update', { state: next, serverTimestamp: Date.now() });
      });

      // Client requests a sync check comparing its position to host
      socket.on('playback:syncRequest', async (data: { roomId: string; position: number; deviceId?: string }) => {
        const { roomId, position, deviceId } = data;
        if (!roomId) return;
        const state = await getCachedPlaybackState(roomId);
        if (!state) return;
        const hostPosition = state.position + ((Date.now() - state.timestamp) / 1000) * state.speed;
        const driftMs = calculateDrift(hostPosition * 1000, position * 1000);
        if (shouldResync(driftMs)) {
          // instruct client to resync to host
          socket.emit('playback:resync', { targetPosition: hostPosition, serverTimestamp: Date.now() });
        } else {
          socket.emit('playback:synced', { ok: true, driftMs });
        }
      });

      // Buffering state reported by clients
      socket.on('playback:buffer', async (data: { roomId: string; buffering: boolean; position: number; deviceId?: string }) => {
        const { roomId, buffering, position, deviceId } = data;
        if (!roomId) return;
        const state = (await getCachedPlaybackState(roomId)) || null;
        if (!state) return;
        state.deviceStates = state.deviceStates || {};
        state.deviceStates[deviceId || socket.id] = { position, latencyMs: state.deviceStates?.[deviceId || socket.id]?.latencyMs || 0, buffering };
        await setCachedPlaybackState(roomId, state);
        emitToRoom(io!, roomId, 'playback:bufferUpdate', { deviceId: deviceId || socket.id, buffering, position });
      });

      // Subtitle track synchronization
      socket.on('playback:subtitle', async (data: { roomId: string; track: string }) => {
        const { roomId, track } = data;
        if (!roomId) return;
        const state = (await getCachedPlaybackState(roomId)) || null;
        const next = state ? reconcilePlaybackState(state, { subtitleTrack: track }) : ({ roomId, hostId: (user as any).id, subtitleTrack: track, timestamp: Date.now() } as any);
        await setCachedPlaybackState(roomId, next);
        emitToRoom(io!, roomId, 'playback:subtitleUpdate', { track, serverTimestamp: Date.now() });
      });

      // Host transfer
      socket.on('host:transfer', async (data: { roomId: string; newHostId: string }) => {
        const { roomId, newHostId } = data;
        if (!roomId || !newHostId) return;
        const state = (await getCachedPlaybackState(roomId)) || null;
        if (!state) return;
        if (String(state.hostId) !== String((user as any).id)) {
          socket.emit('error', { message: 'Only host can transfer' });
          return;
        }
        state.hostId = newHostId;
        await setCachedPlaybackState(roomId, state);
        emitToRoom(io!, roomId, 'host:transferred', { newHostId });
      });

      // Recover playback state after reconnect
      socket.on('playback:recover', async (data: { roomId: string }) => {
        const { roomId } = data;
        if (!roomId) return;
        const state = await getCachedPlaybackState(roomId);
        if (state) {
          socket.emit('playback:recovered', { state, serverTimestamp: Date.now() });
        }
      });

      socket.on('disconnect', async (reason) => {
        // cleanup session cache
        await redis.del(sessionKey);
      });
    });
  }
  return io;
}
