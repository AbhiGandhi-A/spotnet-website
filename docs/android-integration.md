# SpotNet Backend — Android Integration Guide

This document is the authoritative integration reference for Android app developers connecting to the SpotNet production backend.

**Note:** This file documents the existing backend contract. Do not modify backend code based on this document without coordination.

**Contents**
- **Base URLs**
- **Authentication Flow**
- **API Endpoint Reference** (full list)
- **Socket.IO Realtime API**
- **MongoDB Models**
- **Android Retrofit Integration Guide**
- **Android Socket.IO Integration Guide**
- **Cloudflare R2 Upload Flow**
- **Error Handling Standards**
- **Recommended Android Architecture**
- **Testing Instructions**

---

**Base URLs**

- **BASE_API_URL**: https://spotnet-backend.onrender.com (production)
- **SOCKET_URL**: wss://spotnet-backend.onrender.com (use wss in production)
- **SOCKET_IO_PATH**: /api/socket

Use the `BASE_API_URL` as the base for HTTP requests, e.g. `${BASE_API_URL}/api/auth/login`.
Use `SOCKET_URL` + `SOCKET_IO_PATH` for Socket.IO connections.

---

**Authentication Flow**

**Overview**
- Auth is JWT-based with short-lived access tokens and long-lived refresh tokens.
- Access tokens are issued at login/signup and used in `Authorization: Bearer <token>` header.
- Refresh tokens are rotated via `POST /api/auth/refresh` to obtain new access tokens.

**Signup Flow**
1. Client POSTs to `/api/auth/signup` with user details (see API reference). 2. On success server returns access and refresh tokens and user profile. 3. Client persists tokens securely and begins authenticated session.

**Login Flow**
1. Client POSTs to `/api/auth/login` with credentials. 2. Server returns `accessToken` and `refreshToken` and user profile.

**JWT Access Token Usage**
- Include header: `Authorization: Bearer <accessToken>` for protected endpoints.
- Access tokens expire (default `15m`). Server expects them for WebSocket authentication and API calls.

**Refresh Token Flow**
- Call `POST /api/auth/refresh` with the `refreshToken` (in body or cookie depending on client implementation) to get a fresh `accessToken` (and possibly a new `refreshToken`).

**Auth Headers and Protected Request Format**
- Header: `Authorization: Bearer <accessToken>`
- Content-Type: `application/json`
- Example: `curl -H "Authorization: Bearer ey..." ${BASE_API_URL}/api/profile/update`

**Logout Flow**
- `POST /api/auth/logout` invalidates the current refresh token. Client should remove stored tokens after successful response.

**Token Persistence Strategy (Android)**
- Store `accessToken` in-memory and in secure storage (EncryptedSharedPreferences).
- Store `refreshToken` in EncryptedSharedPreferences.
- Access tokens are short-lived → prefer using `refreshToken` to obtain new access tokens when 401 encountered.
- Use OkHttp Interceptor to inject token and auto-refresh on 401.

---

**Complete API Endpoint Reference**

Format for each endpoint:
- Method
- Path (full)
- Auth required
- Headers
- Body (example)
- Query params (if any)
- Success response (example)
- Error response (example)
- Kotlin Retrofit data models (recommended)

Note: This reference is authoritative for the API implemented in this backend.

-------------------------------------------------------------------

**Authentication**

1) **POST** /api/auth/signup
- Path: POST ${BASE_API_URL}/api/auth/signup
- Auth: no
- Headers: `Content-Type: application/json`
- Body example:
  {
    "username": "alice",
    "email": "alice@example.com",
    "password": "s3cureP@ss"
  }
- Success response (200):
  {
    "success": true,
    "user": { /* user object */ },
    "accessToken": "ey...",
    "refreshToken": "rft..."
  }
- Error response (400/409):
  { "success": false, "error": "Username already exists" }
- Kotlin data models:
  data class SignupRequest(val username: String, val email: String, val password: String)
  data class AuthResponse(val success: Boolean, val user: UserDto, val accessToken: String, val refreshToken: String)

2) **POST** /api/auth/login
- Path: POST ${BASE_API_URL}/api/auth/login
- Auth: no
- Body example:
  { "email": "alice@example.com", "password": "s3cureP@ss" }
- Success response:
  { "success": true, "user": {/*...*/}, "accessToken": "ey...", "refreshToken": "rft..." }
- Errors: 401 invalid credentials
- Kotlin models: LoginRequest, AuthResponse

3) **POST** /api/auth/logout
- Path: POST ${BASE_API_URL}/api/auth/logout
- Auth: yes (access token)
- Body: {} (server invalidates tokens by token or cookie)
- Success: { "success": true }

4) **GET** /api/auth/me
- Path: GET ${BASE_API_URL}/api/auth/me
- Auth: yes
- Headers: Authorization
- Success:
  { "success": true, "user": { /* user fields */ } }

5) **POST** /api/auth/refresh
- Path: POST ${BASE_API_URL}/api/auth/refresh
- Auth: no (requires refresh token in body)
- Body: { "refreshToken": "rft..." }
- Success:
  { "success": true, "accessToken": "ey...", "refreshToken": "rft2..." }
- Errors: 401 invalid refresh / revoked

-------------------------------------------------------------------

**Users & Profile**

1) **GET** /api/users
- Path: GET ${BASE_API_URL}/api/users
- Auth: optional or yes (depending) — supports query params for search/pagination
- Query params: `q` (search), `limit`, `offset` or `page`
- Success: { users: [UserDto], total: 100 }

2) **GET** /api/profile/[username]
- Path: GET ${BASE_API_URL}/api/profile/{username}
- Auth: optional
- Success: { user: { /* public profile fields */ } }

3) **PATCH** /api/profile/update
- Path: PATCH ${BASE_API_URL}/api/profile/update
- Auth: yes
- Body example:
  { "displayName": "Alice A.", "bio": "Loves music" }
- Content-Type: application/json
- Success: { success: true, user: { /* updated */ } }

4) **POST** /api/profile/avatar
- Path: POST ${BASE_API_URL}/api/profile/avatar
- Auth: yes
- Content-Type: multipart/form-data
- Form field: `avatar` (file)
- Success: { success: true, avatarUrl: "https://..." }

-------------------------------------------------------------------

**Friends**

1) **POST** /api/friends
- Path: POST ${BASE_API_URL}/api/friends
- Auth: yes
- Body: { "friendId": "<userId>" }
- Success: { success: true }

2) **GET** /api/friends
- Returns friend list

3) **DELETE** /api/friends/[friendId]
- Remove friend

4) **GET** /api/friends/requests
- Returns incoming friend requests

5) **POST** /api/friends/accept
- Body: { "requestId": "..." }

6) **POST** /api/friends/reject
- Body: { "requestId": "..." }

7) **GET** /api/friends/suggestions
- Returns suggested users to follow

-------------------------------------------------------------------

**Rooms**

1) **POST** /api/rooms
- Create a room
- Auth required
- Body example:
  {
    "name": "Friday Watch",
    "isPublic": true,
    "maxMembers": 50
  }
- Success: { success: true, room: RoomDto }

2) **GET** /api/rooms/public
- Returns public rooms (pagination)

3) **GET** /api/rooms/trending
4) **GET** /api/rooms/recent

5) **GET** /api/rooms/[roomId]
- Get room details

6) **PATCH** /api/rooms/[roomId]
- Update room metadata

7) **DELETE** /api/rooms/[roomId]
- Delete room (owner only)

8) **POST** /api/rooms/[roomId]/join
- Body: { "password"?: "" }
- Success: { success: true, roomState: {...} }

9) **POST** /api/rooms/[roomId]/leave
- Leave room

10) **GET** /api/rooms/[roomId]/members

11) **POST** /api/rooms/[roomId]/transfer-host
- Body: { "newHostId": "..." }

12) **POST** /api/rooms/[roomId]/invite
- Body: { "userId": "..." }

13) **POST** /api/rooms/[roomId]/kick
14) **POST** /api/rooms/[roomId]/ban
15) **POST** /api/rooms/[roomId]/invite-link
16) **POST** /api/rooms/[roomId]/playback-sync
- Used to update authoritative playback state from host
- Body: { "position": number, "playing": boolean, "speed": number }

17) **POST** /api/rooms/[roomId]/playback-recover
- Host recovers playback state

-------------------------------------------------------------------

**Videos**

1) **POST** /api/videos
- Create video metadata
- Body: { "title": "...", "description": "...", "duration": 123 }

2) **POST** /api/videos/upload-url
- Request a signed upload URL for Cloudflare R2
- Body: { "filename": "video.mp4", "contentType": "video/mp4" }
- Success: { "uploadUrl": "https://...", "key": "videos/....mp4" }

3) **DELETE** /api/videos/[videoId]
4) **POST** /api/videos/thumbnail
- Generate or upload thumbnail

-------------------------------------------------------------------

**Notifications**

1) **GET** /api/notifications
- Auth: yes
- Returns paginated notifications

2) **POST** /api/notifications/send
- Auth: yes (server or moderators)
- Body: { "userId": "...", "title": "...", "body": "...", "data": {...} }

3) **PATCH** /api/notifications/read
- Body: { "ids": ["..."] }

4) **DELETE** /api/notifications/[id]

-------------------------------------------------------------------

**Chat**

1) **GET** /api/chat?roomId=
- Returns messages for a room (paginated)

2) **POST** /api/chat/send
- Body: { "roomId": "...", "text": "..." }
- Success: { "message": MessageDto }

3) **DELETE** /api/chat/[messageId]
4) **PATCH** /api/chat/[messageId]
- Update message content

5) **POST** /api/chat/[messageId]/reply
- Body: { "text": "..." }

6) **POST** /api/chat/[messageId]/react
- Body: { "reaction": "like" }

7) **POST** /api/chat/[messageId]/read
- Mark message read

8) **GET** /api/chat/history
- Returns user's message history

-------------------------------------------------------------------

**Presence**

1) **POST** /api/presence/heartbeat
- Body: { "roomId": "...", "deviceId": "...", "position": number }
- Auth: yes

-------------------------------------------------------------------

**Search**

1) **GET** /api/search/users?q=
2) **GET** /api/search/rooms?q=
3) **GET** /api/search/videos?q=

All support `limit`/`offset` pagination.

-------------------------------------------------------------------

**History**

1) **GET** /api/history/watch
2) **GET** /api/history/uploads

-------------------------------------------------------------------

**Analytics**

1) **GET** /api/analytics/rooms
2) **GET** /api/analytics/users

-------------------------------------------------------------------

**Health**

1) **GET** /api/health
- Public health endpoint. Useful for uptime checks.
- Response example:
  {
    "success": true,
    "status": "ok",
    "timestamp": "...",
    "redis": { "status": "unavailable" },
    "metrics": { /* ... */ }
  }

---

**Complete Socket.IO Documentation**

**Connection**
- Endpoint: `${SOCKET_URL}${SOCKET_IO_PATH}`
- Use Socket.IO client v4+ for Android (socket.io-client-java).
- Authentication: pass `auth: { token: <accessToken> }` in connection options or send `token` in `handshake.auth`.

Example (conceptual):
- client = IO.socket(SOCKET_URL, IO.Options.builder().setPath(SOCKET_IO_PATH).setQuery(null).build())
- For Java/Kotlin Socket.IO client, use `io.socket:socket.io-client:2.0.1` (platform-specific)

**Auth token connection method**
- On connect, server reads `handshake.auth.token` and verifies via `process.env.JWT_SECRET`.
- Token must be `Bearer`-less raw JWT.

**Namespaces**
- Server uses default namespace `/` (no special namespaces). Events live on the default namespace.

**Reconnection strategy**
- Configure exponential backoff: initial 500ms, max 10s, attempts unlimited or reasonable cap.
- On 401/Invalid token, drop connection and prompt re-auth.

**Heartbeat handling**
- Socket pings/pongs are configured by server. Client should rely on Socket.IO keepalive. Additionally, the app should POST presence heartbeat when active.

**Disconnect handling**
- Listen for `disconnect` event; show offline UI and schedule reconnect attempts.

**Realtime Events (emit / receive)**

For each event below: payload examples and Kotlin socket usage.

1) `room:create`
- Client emit: { name: string, isPublic?: boolean, settings?: {} }
- Server emit (broadcast): { room: RoomDto }
- Ack: { success: true, roomId }

2) `room:join`
- Client emit: { roomId: string }
- Server emit to room: { userId, joinedAt }
- Ack: { success: true, state: { ... } }

3) `room:leave`
- Client emit: { roomId }
- Server broadcast: { userId }

4) `video:play`
- Client emit: { roomId, position: number, timestamp: number }
- Server broadcast: { position, serverTimestamp }

5) `video:pause`
- Payload: { roomId, position }

6) `video:seek`
- Payload: { roomId, position }

7) `video:volume`
- Payload: { roomId, volume }

8) `room:sync`
- Host emit: { roomId, state: { position, playing, speed, timestamp } }
- Server broadcast authoritative state

9) `notification:send`
- Client (server-privileged) emit: { userId, title, body, data }
- Server send to `notification:receive` event for user devices

10) `notification:receive`
- Client receives: { title, body, data }

11) `chat:message`
- Client emit: { roomId, text }
- Server broadcast to room: { message: MessageDto }
- Ack contains saved `messageId`

12) `typing:start` / `typing:stop`
- Client emit: { roomId }
- Server broadcast: { userId }

13) `presence:update`
- Client emit: { roomId, deviceId, position }
- Server uses it for playback reconciliation

Kotlin Socket.IO example (conceptual)
```
val options = IO.Options()
options.path = "/api/socket"
options.query = ""
options.auth = JSONObject().put("token", accessToken)
val socket = IO.socket(SOCKET_URL, options)
socket.on(Socket.EVENT_CONNECT) { /* connected */ }
socket.on("chat:message") { args -> /* handle message */ }
socket.connect()
```

Acknowledge patterns: server may accept callback acknowledgements. Use `socket.emit(event, payload, Ack { args -> ... })`.

---

**Database Model Documentation (MongoDB)**

All models use MongoDB ObjectId for `_id`. Timestamps: `createdAt`, `updatedAt` where applicable.

1) `User`
- Fields:
  - `_id`: ObjectId
  - `username`: string (required, unique)
  - `email`: string (required, unique)
  - `passwordHash`: string (required)
  - `displayName`: string
  - `bio`: string
  - `avatarUrl`: string
  - `deviceTokens`: [{ token, platform, deviceId, updatedAt }]
  - `createdAt`, `updatedAt`
- Relations:
  - friends via `Friend` collection

2) `Room`
- Fields:
  - `_id`, `name`, `description`, `isPublic` (bool), `hostId` (ObjectId), `members` (array of RoomMember), `settings` (object), `createdAt`, `updatedAt`

3) `RoomMember`
- Fields:
  - `userId` ObjectId
  - `joinedAt` Date
  - `role` string ('host'|'member'|'moderator')

4) `Video`
- Fields:
  - `_id`, `title`, `description`, `duration` (seconds), `key` (R2 key), `uploaderId`, `thumbnailUrl`, `createdAt`, `updatedAt`

5) `Notification`
- Fields:
  - `_id`, `userId`, `title`, `body`, `data` (object), `read` (bool), `createdAt`

6) `Friend`
- Fields:
  - `_id`, `userId`, `friendId`, `status` ('pending'|'accepted'|'rejected'), `createdAt`

7) `Message`
- Fields:
  - `_id`, `roomId`, `senderId`, `text`, `replies` (array), `reactions` (map), `createdAt`, `editedAt`

8) `WatchHistory`
- Fields:
  - `_id`, `userId`, `videoId`, `watchedAt`, `position`

9) `Session` (for refresh tokens tracking)
- Fields:
  - `_id`, `userId`, `refreshToken`, `expiresAt`, `createdAt`, `ip`, `deviceInfo`

---

**Android Retrofit Integration Guide**

1) Retrofit setup
- Use `Retrofit.Builder()` with `GsonConverterFactory` or `MoshiConverterFactory`.
- Base URL = `BASE_API_URL`.

2) OkHttp interceptors
- JWT Auth Interceptor: adds `Authorization` header and handles 401 → trigger refresh flow synchronously or via coroutine-safe refresh queue.
- Logging Interceptor: use `HttpLoggingInterceptor` in debug builds.

3) JWT Auth Interceptor (concept)
- Intercept request, add `Authorization: Bearer <accessToken>` if available.
- On 401, pause queue, call refresh endpoint to obtain a new access token, retry original request once.
- Persist refreshed tokens.

4) API service interface examples
- Use Kotlin `suspend` functions and `Response<T>` wrappers.

Example Retrofit service snippet:
```kotlin
interface AuthApi {
  @POST("/api/auth/login")
  suspend fun login(@Body req: LoginRequest): Response<AuthResponse>
}
```

5) Repository pattern
- `AuthRepository` wraps `AuthApi`, handles token storage and refresh logic.
- Use `suspend` functions and `Flow` for streams where helpful.

6) Pagination handling
- Consistent `limit`/`offset` query params.
- Provide helper functions to request next page when scrolling.

7) Multipart upload handling
- For avatar or video uploads to backend (if uploading directly) or to R2 with signed URL.
- Retrofit Multipart example:
```kotlin
@Multipart
@POST("/api/profile/avatar")
suspend fun uploadAvatar(@Part avatar: MultipartBody.Part): Response<AvatarResponse>
```
- For R2 signed uploads, use OkHttp `PUT` to `uploadUrl` returned by `/api/videos/upload-url`.

---

**Android Socket.IO Integration Guide**

1) Socket manager structure
- Singleton `SocketManager` with lifecycle-aware connect/disconnect.
- Provide `connect(token)` and `disconnect()` APIs.

2) Connection lifecycle handling
- Connect when app foreground and user authenticated.
- Disconnect on logout or app background (configurable).

3) Room synchronization handling
- Use local authoritative state for non-host clients; host sends `room:sync` events.
- Reconciliation: on `playback:update` reconcile using server timestamps.

4) Playback event handling
- Emit `video:play/pause/seek` from host.
- Client uses delta calculation with server timestamp to adjust playback.

5) Reconnect handling
- On reconnect, re-join rooms with `room:join` and request `playback:state`.

6) Event listener cleanup
- Remove listeners on disconnect to avoid leaks. In Kotlin, use `LifecycleObserver` or `CoroutineScope` to tie listeners to lifecycle.

---

**Cloudflare R2 Upload Flow**

1) Upload URL generation
- Client requests `POST /api/videos/upload-url` with filename and contentType.
- Server returns `uploadUrl` and `key`.

2) Multipart vs Single PUT
- For large videos use multipart/resumable client or multipart upload support; simplest approach: use single PUT to signed URL.

3) Thumbnail upload
- Either server generates thumbnail after upload or client requests `POST /api/videos/thumbnail` with thumbnail data.

4) Progress handling
- Use OkHttp `ProgressRequestBody` to report bytes uploaded.

5) Media URL generation
- Use `R2_PUBLIC_URL` + key to serve media. Example: `${R2_PUBLIC_URL}/${key}`

---

**Error Handling Standards**

- Standard error response:
  {
    "success": false,
    "error": "Human readable message",
    "code": "ERR_CODE",
    "details": { ... }
  }

- Auth errors: 401 with `ERR_UNAUTHORIZED`. On 401:
  - Attempt token refresh once.
  - If refresh fails, sign out user and redirect to login.

- Retry strategy:
  - Idempotent requests (GET) → retry with exponential backoff (max 3 attempts).
  - Non-idempotent (POST) → avoid automatic retry unless user explicitly retries.

- Socket reconnect: use exponential backoff, refresh token on reconnect if needed.

- Upload failures: resume or restart upload; notify user and allow retry.

---

**Recommended Android Architecture**

- Use MVVM with `ViewModel` + `LiveData`/`StateFlow`.
- `Repository` layer for network + cache.
- `DataSource` layer: `RemoteDataSource` (Retrofit) and `LocalDataSource` (Room DB or in-memory cache).
- `RealtimeSyncManager` for Socket.IO logic.
- `UploadManager` for upload lifecycle and progress notifications.

---

**Testing Instructions**

1) Postman
- Import collection mapping endpoints above; set environment variables `BASE_API_URL`, `ACCESS_TOKEN`.
- Test auth flows and socket handshake using Postman web sockets (or dedicated tools).

2) cURL examples
- Login:
  ```bash
  curl -X POST ${BASE_API_URL}/api/auth/login -H "Content-Type: application/json" -d '{"email":"alice@example.com","password":"..."}'
  ```

3) Android testing flow
- Use emulator + dev backend or staging environment.
- For real-time multi-device tests, run two emulators logged in as different users and join same room.

4) Multi-device realtime testing
- Test host control: one device hosts and changes playback; other devices should follow.
- Test network flakiness: disable network on one device and restore; verify reconnection and state recovery.

---

**Appendix: DTO Suggestions (Kotlin)**

- `UserDto`
```kotlin
data class UserDto(
  val id: String,
  val username: String,
  val email: String?,
  val displayName: String?,
  val avatarUrl: String?,
  val bio: String?
)
```

- `RoomDto`, `VideoDto`, `MessageDto`, `NotificationDto` follow similar patterns with primitive types and IDs as `String`.

---

If you want, I can also:
- Generate a Postman collection for these endpoints.
- Produce a concise Kotlin Retrofit interfaces file with the models included.


*Document created: docs/android-integration.md*
