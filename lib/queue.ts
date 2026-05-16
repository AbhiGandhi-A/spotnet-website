import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import { logInfo, logError, logWarn } from '@/utils/logger';

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

export const videoProcessingQueue = new Queue('video-processing', getConnection());
export const thumbnailQueue = new Queue('thumbnail-generation', getConnection());
export const notificationQueue = new Queue('notification-delivery', getConnection());
export const cleanupQueue = new Queue('cleanup-jobs', getConnection());
export const analyticsQueue = new Queue('analytics-aggregation', getConnection());
export const deadLetterQueue = new Queue('dead-letter-jobs', getConnection());

export async function addQueueJob(queue: Queue, name: string, data: any, opts: JobsOptions = {}) {
  return queue.add(name, data, {
    attempts: opts.attempts ?? 3,
    backoff: opts.backoff ?? { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
    ...opts,
  });
}

export function createWorker(name: string, processor: (job: any) => Promise<any>, opts: { concurrency?: number } = {}) {
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

export async function getQueueStatus(queue: Queue) {
  return {
    waiting: await queue.getWaitingCount(),
    active: await queue.getActiveCount(),
    completed: await queue.getCompletedCount(),
    failed: await queue.getFailedCount(),
    delayed: await queue.getDelayedCount(),
  };
}

export function setupQueueMonitoring() {
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
  await deadLetterQueue.add(`dead-letter-${job.id}`, { originalJob: job }, { removeOnComplete: true });
}
