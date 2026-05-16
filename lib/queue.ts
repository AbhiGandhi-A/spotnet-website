import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import { logInfo, logError, logWarn } from '@/utils/logger';

const REDIS_URL = process.env.REDIS_URL?.trim();
const REDIS_HOST = process.env.REDIS_HOST?.trim();
const REDIS_PORT = process.env.REDIS_PORT?.trim();
const REDIS_ENABLED = Boolean(REDIS_URL || REDIS_HOST || REDIS_PORT);

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB || 0),
};

function getConnection() {
  return { connection };
}

export const videoProcessingQueue = REDIS_ENABLED ? new Queue('video-processing', getConnection()) : null;
export const thumbnailQueue = REDIS_ENABLED ? new Queue('thumbnail-generation', getConnection()) : null;
export const notificationQueue = REDIS_ENABLED ? new Queue('notification-delivery', getConnection()) : null;
export const cleanupQueue = REDIS_ENABLED ? new Queue('cleanup-jobs', getConnection()) : null;
export const analyticsQueue = REDIS_ENABLED ? new Queue('analytics-aggregation', getConnection()) : null;
export const deadLetterQueue = REDIS_ENABLED ? new Queue('dead-letter-jobs', getConnection()) : null;

export async function addQueueJob(queue: Queue | null, name: string, data: any, opts: JobsOptions = {}) {
  if (!queue) {
    throw new Error('Queue unavailable: Redis is not configured');
  }
  return queue.add(name, data, {
    attempts: opts.attempts ?? 3,
    backoff: opts.backoff ?? { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
    ...opts,
  });
}

export function createWorker(name: string, processor: (job: any) => Promise<any>, opts: { concurrency?: number } = {}) {
  if (!REDIS_ENABLED) {
    throw new Error('Workers are unavailable: Redis is not configured');
  }

  const worker = new Worker(name, async (job) => processor(job), {
    ...getConnection(),
    concurrency: opts.concurrency ?? 1,
    autorun: true,
    lockDuration: 300000,
  });

  worker.on('completed', (job) => {
    logInfo(`queue:${name} completed`, { jobId: job.id, name: job.name });
  });

  worker.on('failed', (job, err) => {
    logError(`queue:${name} failed`, { jobId: job?.id, name: job?.name, error: err?.message || err });
  });

  worker.on('error', (error) => {
    logError(`queue:${name} worker error`, error);
  });

  return worker;
}

export async function getQueueStatus(queue: Queue | null) {
  if (!queue) {
    throw new Error('Queue unavailable: Redis is not configured');
  }
  return {
    waiting: await queue.getWaitingCount(),
    active: await queue.getActiveCount(),
    completed: await queue.getCompletedCount(),
    failed: await queue.getFailedCount(),
    delayed: await queue.getDelayedCount(),
  };
}

export function setupQueueMonitoring() {
  if (!REDIS_ENABLED) {
    throw new Error('Queue monitoring unavailable: Redis is not configured');
  }
  const queueEvents = new QueueEvents('global-events', getConnection());

  queueEvents.on('completed', ({ jobId, returnvalue }) => {
    logInfo('queue job completed', { jobId, returnvalue });
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    logWarn('queue job failed', { jobId, failedReason });
  });

  queueEvents.on('stalled', ({ jobId }) => {
    logWarn('queue job stalled', { jobId });
  });

  queueEvents.on('error', (error) => {
    logError('queue events error', error);
  });
}

export async function enqueueDeadLetter(job: any) {
  if (!deadLetterQueue) {
    throw new Error('Dead letter queue unavailable: Redis is not configured');
  }
  await deadLetterQueue.add(`dead-letter-${job.id}`, { originalJob: job }, { removeOnComplete: true });
}
