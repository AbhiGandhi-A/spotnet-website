# SpotNet Backend

Production-ready backend for Watch Together social streaming app using Next.js App Router, TypeScript, MongoDB, Socket.IO, JWT, and Cloudflare R2.

## Features
- Modular API routes (auth, users, friends, rooms, videos, notifications, chat)
- Native MongoDB integration
- JWT authentication (access/refresh tokens)
- Real-time with Socket.IO
- Cloudflare R2 for video uploads
- Zod validation, rate limiting, CORS, secure headers
- Production folder structure

## Setup
1. Copy `.env.example` to `.env` and fill in your secrets.
2. Install dependencies:
	```sh
	npm install
	```
3. Start the dev server:
	```sh
	npm run dev
	```

## API Endpoints
- `POST /api/auth/signup` — Register user
- `POST /api/auth/login` — Login user
- `POST /api/auth/logout` — Logout user
- `GET /api/auth/me` — Get current user
- `POST /api/auth/refresh` — Refresh access token
- `GET /api/users` — List/search users
- `POST /api/friends` — Send friend request
- `POST /api/rooms` — Create room
- `POST /api/videos` — Upload video metadata
- `GET /api/notifications` — Get notifications
- `GET /api/chat?roomId=...` — Get chat messages

## Real-Time Events
- Socket.IO server at `/api/socket`
- Auth required for all events

## Folder Structure
- `app/api/` — API route handlers
- `lib/` — MongoDB, R2, etc.
- `services/` — Business logic
- `controllers/` — Route controllers
- `middleware/` — Auth, rate limit, etc.
- `socket/` — Socket.IO server/events
- `types/` — TypeScript types
- `validators/` — Zod schemas
- `config/` — CORS, headers
- `utils/` — Helpers

---

This backend is ready for production and extensible for all SpotNet features.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/route.ts`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
## Run with Node

This backend can be run directly with Node and `tsx`:

```bash
npm install
npm run build
npm start
```

If you want to run the dev server locally:

```bash
npm run dev
```

If you need worker processes, start them separately:

```bash
npm run worker
```
## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## API Routes

This directory contains example API routes for the headless API app.

For more details, see [route.js file convention](https://nextjs.org/docs/app/api-reference/file-conventions/route).
