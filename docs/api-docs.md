# SpotNet Backend API Documentation

## Authentication
- `POST /api/auth/login` - Exchange credentials for JWT access and refresh tokens.
- `POST /api/auth/signup` - Create a user account.
- `POST /api/auth/refresh` - Rotate refresh token and issue a new access token.
- `POST /api/auth/logout` - Invalidate the current session.
- `GET /api/auth/me` - Return authenticated user profile.

## Real-time synchronization
- Socket.IO `playback:join` - Join a playback session and receive authoritative room state.
- Socket.IO `playback:control` - Host or authorized user controls play/pause/seek/speed.
- Socket.IO `playback:syncRequest` - Client requests resynchronization based on server authoritative state.
- Socket.IO `playback:buffer` - Report buffering state for multi-device sync.
- Socket.IO `playback:subtitle` - Update synchronized subtitle track.
- Socket.IO `host:transfer` - Transfer room host authority.
- Socket.IO `playback:recover` - Recover playback state after reconnect.

## Notification APIs
- `POST /api/notifications/token` - Register a device token for push notifications.
- `POST /api/notifications/send` - Send a notification (existing endpoint).
- `GET /api/notifications` - List pending notifications.

## Analytics APIs
- `GET /api/analytics/rooms` - Room analytics including trending rooms and peak usage.
- `GET /api/analytics/users` - User analytics including retention and active user trends.

## Recommendation APIs
- `GET /api/recommendations/rooms` - Personalized recommended rooms.
- `GET /api/recommendations/users` - Suggested users and recently active friends.

## Security APIs
- `GET /api/security/login-history` - Retrieve the user's login and security event history.

## Monitoring and health
- `GET /api/health` - Health status, Redis connectivity, and server metrics.

## Environment Variables
Required variables:
- `DATABASE_URL` or `MONGODB_URI`
- `JWT_SECRET`
- `REDIS_HOST` / `REDIS_PORT` or `REDIS_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_URL`

Optional variables:
- `NODE_ENV`
- `PORT`
- `CORS_ORIGIN`
- `SOCKET_IO_PATH`
- `RATE_LIMIT_WINDOW_SECONDS`
- `RATE_LIMIT_MAX_REQUESTS`
- `RATE_LIMIT_BLOCK_SECONDS`
- `LOG_LEVEL`

## Deployment
- Use the included `Dockerfile` and `docker-compose.yml` for local and production deployments.
- Deploy behind a load balancer with sticky-session support disabled when using the Redis socket adapter.
- Scale workers and socket nodes independently.
