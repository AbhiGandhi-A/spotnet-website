# Deployment Guide

## Run with Node

This project is designed to run as a regular Node.js service.

1. Copy `.env.example` to `.env` and fill in your secrets.
2. Install dependencies:

```bash
npm install
```

3. Build the app:

```bash
npm run build
```

4. Start the server:

```bash
npm start
```

If you want to run only the worker process:

```bash
npm run worker
```

## Optional Docker

If you later want to use Docker, the repository already includes a `Dockerfile`.

```bash
docker build -t spotnet-backend .
```

## PM2

The `ecosystem.config.js` file defines two apps:
- `spotnet-backend` - HTTP + Socket.IO server
- `spotnet-workers` - background job workers

Start them with:

```bash
npm install -g pm2
npm run build
pm2 start ecosystem.config.js
```

## CI/CD

The GitHub Actions workflow at `.github/workflows/ci.yml` runs TypeScript validation, lint, and tests on every pull request.

## Environment

Make sure these values are provided in production:
- `DATABASE_URL`
- `REDIS_HOST` / `REDIS_PORT` or `REDIS_URL`
- `JWT_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_URL`
- `CORS_ORIGIN`
- `SOCKET_IO_PATH`

## Scaling

SpotNet is designed for horizontal scaling:
- API servers are stateless and rely on Redis for session/cache state.
- Socket.IO uses Redis adapter for distributed event propagation.
- Workers can scale independently to handle media processing, notifications, and cleanup.
- Use a load balancer in front of Node.js instances and route all traffic to the same API base.
