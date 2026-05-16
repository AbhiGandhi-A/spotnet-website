import http from 'http';
import next from 'next';
import { parse } from 'url';
import { connectRedis, disconnectRedis, getSocketRedisAdapter } from '@/lib/redis';
import { initSocket } from '@/socket/index';
import { logInfo, logError } from '@/utils/logger';
import requestLogger from '@/middleware/requestLogger';
import { rateLimit } from '@/middleware/rateLimit';

const port = Number(process.env.PORT || 3000);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

async function startServer() {
  await app.prepare();
  await connectRedis();

  const server = http.createServer(async (req, res) => {
    try {
      requestLogger(req, res);
      if (!(await rateLimit(req, res))) {
        return;
      }
      const parsedUrl = parse(req.url || '', true);
      handle(req, res, parsedUrl);
    } catch (error) {
      logError('Request handling error', error);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  const io = initSocket(server);
  io.adapter(getSocketRedisAdapter());

  server.listen(port, () => {
    logInfo(`SpotNet backend running on http://localhost:${port}`);
  });

  async function gracefulShutdown() {
    logInfo('Graceful shutdown initiated');
    io.close();
    server.close(async () => {
      await disconnectRedis();
      logInfo('Shutdown complete');
      process.exit(0);
    });
  }

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

startServer().catch((error) => {
  logError('Failed to start server', error);
  process.exit(1);
});
