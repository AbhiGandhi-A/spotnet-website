import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' as any, options: { colorize: true } },
});

export default logger;

export function logInfo(message: string, ...args: any[]) {
  logger.info({ args }, message);
}

export function logWarn(message: string, ...args: any[]) {
  logger.warn({ args }, message);
}

export function logError(message: string, ...args: any[]) {
  logger.error({ args }, message);
}

export { pino };
