# SpotNet Backend Documentation

## Overview
SpotNet is a production-ready, scalable backend for a Watch Together social streaming platform. It is built with Next.js App Router, TypeScript, MongoDB, Socket.IO, JWT, and Cloudflare R2. The backend is modular, secure, and ready for real-world deployment.

---

## API Documentation

### Authentication
- `POST /api/auth/signup` — Register user
- `POST /api/auth/login` — Login user
- `POST /api/auth/logout` — Logout user
- `GET /api/auth/me` — Get current user
- `POST /api/auth/refresh` — Refresh access token

### User & Profile
- `GET /api/users` — List/search users
- `GET /api/profile/[username]` — Get user profile
- `PATCH /api/profile/update` — Update profile
- `POST /api/profile/avatar` — Upload profile image

### Friends
- `POST /api/friends` — Send friend request
- `GET /api/friends` — List friends
- `DELETE /api/friends/[friendId]` — Remove friend
- `GET /api/friends/requests` — List friend requests
- `POST /api/friends/accept` — Accept request
- `POST /api/friends/reject` — Reject request
- `GET /api/friends/suggestions` — Friend suggestions

### Rooms
- `POST /api/rooms` — Create room
- `GET /api/rooms/public` — List public rooms
- `GET /api/rooms/trending` — Trending rooms
- `GET /api/rooms/recent` — Recent rooms
- `GET /api/rooms/[roomId]` — Room details
- `PATCH /api/rooms/[roomId]` — Update room
- `DELETE /api/rooms/[roomId]` — Delete room
- `POST /api/rooms/[roomId]/join` — Join room
- `POST /api/rooms/[roomId]/leave` — Leave room
- `GET /api/rooms/[roomId]/members` — Room members
- `POST /api/rooms/[roomId]/transfer-host` — Transfer host
- `POST /api/rooms/[roomId]/invite` — Invite user
- `POST /api/rooms/[roomId]/kick` — Kick user
- `POST /api/rooms/[roomId]/ban` — Ban user
- `POST /api/rooms/[roomId]/invite-link` — Generate invite link
- `POST /api/rooms/[roomId]/playback-sync` — Playback sync
- `POST /api/rooms/[roomId]/playback-recover` — Playback recovery

### Videos
- `POST /api/videos` — Upload video metadata
- `POST /api/videos/upload-url` — Get signed upload URL
- `DELETE /api/videos/[videoId]` — Delete video
- `POST /api/videos/thumbnail` — Upload thumbnail
- `GET /api/history/watch` — Watch history
- `GET /api/history/uploads` — Upload history

### Notifications
- `GET /api/notifications` — Get notifications
- `POST /api/notifications/send` — Send notification
- `PATCH /api/notifications/read` — Mark as read
- `DELETE /api/notifications/[id]` — Delete notification

### Chat
- `GET /api/chat?roomId=...` — Get messages
- `POST /api/chat/send` — Send message
- `DELETE /api/chat/[messageId]` — Delete message
- `PATCH /api/chat/[messageId]` — Edit message
- `POST /api/chat/[messageId]/reply` — Reply
- `POST /api/chat/[messageId]/react` — Emoji reaction
- `POST /api/chat/[messageId]/read` — Mark as read
- `GET /api/chat/history` — Paginated history

### Presence
- `POST /api/presence/heartbeat` — Heartbeat

### Search
- `GET /api/search/users` — Search users
- `GET /api/search/rooms` — Search rooms
- `GET /api/search/videos` — Search videos

### Analytics
- `GET /api/analytics/rooms` — Room analytics
- `GET /api/analytics/users` — User analytics

### Health
- `GET /api/health` — Health check

---

## Socket.IO Events
- room:create, room:join, room:leave, room:update, room:delete
- video:play, video:pause, video:seek, video:volume, video:sync, video:buffer
- notification:send, notification:receive
- user:online, user:offline
- friend:request, friend:accept
- room:chat, chat:typing, chat:read, chat:reaction
- presence:heartbeat

---

## Environment Setup
- Copy `.env.example` to `.env` and fill in secrets
- Install dependencies: `npm install`
- Start dev server: `npm run dev`

---

## Deployment
- Vercel ready
- Dockerfile included
- MongoDB Atlas and Cloudflare R2 integration

---

## Architecture
- Modular, service/controller-based
- Real database, real-time, and storage integration
- Security, validation, and rate limiting everywhere
- Scalable and production-ready

---

## Authentication Flow
- JWT access/refresh tokens
- Secure, stateless session management
- Protected routes and socket events

---

For more details, see code comments and each module’s README or documentation.
