import { IncomingMessage, ServerResponse } from 'http';
import pinoHttp from 'pino-http';
import logger from '@/utils/logger';

const httpLogger = pinoHttp({ logger });

export function requestLogger(req: IncomingMessage, res: ServerResponse) {
  httpLogger(req as any, res as any);
}

export default requestLogger;
