import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import { logInfo, logError, logWarn } from '@/utils/logger';

const REDIS_ENABLED = Boolean(process.env.REDIS_URL);

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

class DummyQueue {
  name: string;
  jobs: any[] = [];
  constructor(name: string) { this.name = name; }
  async add(name: string, data: any, opts?: JobsOptions) {
    const id = `${Date.now()}`;
    this.jobs.push({ id, name, data, opts });
    logWarn('In-memory queue used, job added locally', { queue: this.name, jobId: id });
    return { id } as any;
  }
  async getWaitingCount() { return 0; }
  async getActiveCount() { return 0; }
  async getCompletedCount() { return 0; }
  async getFailedCount() { return 0; }
  async getDelayedCount() { return 0; }
}

class DummyWorker {
  on() { /* noop */ }
}

class DummyQueueEvents {
  on() { /* noop */ }
}

export const videoProcessingQueue = REDIS_ENABLED ? new Queue('video-processing', getConnection()) : new DummyQueue('video-processing') as any;
export const thumbnailQueue = REDIS_ENABLED ? new Queue('thumbnail-generation', getConnection()) : new DummyQueue('thumbnail-generation') as any;
export const notificationQueue = REDIS_ENABLED ? new Queue('notification-delivery', getConnection()) : new DummyQueue('notification-delivery') as any;
export const cleanupQueue = REDIS_ENABLED ? new Queue('cleanup-jobs', getConnection()) : new DummyQueue('cleanup-jobs') as any;
export const analyticsQueue = REDIS_ENABLED ? new Queue('analytics-aggregation', getConnection()) : new DummyQueue('analytics-aggregation') as any;
export const deadLetterQueue = REDIS_ENABLED ? new Queue('dead-letter-jobs', getConnection()) : new DummyQueue('dead-letter-jobs') as any;

export async function addQueueJob(queue: any, name: string, data: any, opts: JobsOptions = {}) {
  if (!REDIS_ENABLED) {
    return queue.add(name, data, opts);
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
    logWarn('Redis not configured. Workers disabled (in-memory/no-op).');
    return new DummyWorker() as any;
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

export async function getQueueStatus(queue: any) {
  if (!REDIS_ENABLED) {
    return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
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
    logWarn('Redis not configured. Queue monitoring disabled.');
    return;
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
  await deadLetterQueue.add(`dead-letter-${job.id}`, { originalJob: job }, { removeOnComplete: true });
}
