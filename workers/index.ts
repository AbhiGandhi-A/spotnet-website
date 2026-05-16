import { ObjectId } from 'mongodb';
import { createWorker, setupQueueMonitoring } from '@/lib/queue';
import { probeVideo, generateThumbnail, generatePreviewClip, optimizeVideo, transcodeToHls, validateMediaFile } from '@/lib/media';
import { connectToDatabase } from '@/lib/mongodb';
import { sendFcmNotification } from '@/lib/fcm';
import { getRedisClient } from '@/lib/redis';
import { logInfo, logError } from '@/utils/logger';

setupQueueMonitoring();

createWorker('video-processing', async (job) => {
  const { inputPath, outputPath, hlsPath, previewPath } = job.data as { inputPath: string; outputPath: string; hlsPath: string; previewPath: string };
  await validateMediaFile(inputPath);
  await probeVideo(inputPath);
  await optimizeVideo(inputPath, outputPath);
  await transcodeToHls(outputPath, hlsPath);
  await generatePreviewClip(outputPath, previewPath);
  return { outputPath, hlsPath, previewPath };
});

createWorker('thumbnail-generation', async (job) => {
  const { inputPath, thumbnailPath } = job.data as { inputPath: string; thumbnailPath: string };
  await generateThumbnail(inputPath, thumbnailPath);
  return { thumbnailPath };
});

createWorker('notification-delivery', async (job) => {
  const { userId, payload } = job.data as { userId: string; payload: { title: string; body: string; data?: Record<string, string> } };
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { deviceTokens: 1 } });
  const tokenList = (user?.deviceTokens || []) as Array<{ token: string }>;
  await Promise.all(tokenList.map((device) => sendFcmNotification(device.token, payload.title, payload.body, payload.data || {})));
  return { delivered: tokenList.length };
});

createWorker('cleanup-jobs', async (job) => {
  const { db } = await connectToDatabase();
  if (job.name === 'expired-invites') {
    await db.collection('invites').deleteMany({ expiresAt: { $lte: new Date() } });
    return { cleaned: 'expired invites' };
  }

  if (job.name === 'inactive-rooms') {
    const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    await db.collection('rooms').updateMany({ updatedAt: { $lte: cutoff }, active: false }, { $set: { archived: true } });
    return { cleaned: 'inactive rooms' };
  }

  if (job.name === 'reconcile-playback-state') {
    const redis = getRedisClient();
    const keys = await redis.keys('room:state:*');
    await Promise.all(keys.map(async (key) => {
      const value = await redis.get(key);
      if (!value) return;
      const state = JSON.parse(value);
      if (!state?.timestamp) return;
      if (Date.now() - state.timestamp > 1000 * 60 * 5) {
        await redis.del(key);
      }
    }));
    return { cleaned: 'stale playback states' };
  }

  return { job: job.name };
});

createWorker('analytics-aggregation', async (job) => {
  const { db } = await connectToDatabase();
  if (job.name === 'watch-history') {
    const now = new Date();
    await db.collection('analytics').updateOne(
      { type: 'watchSummary' },
      {
        $set: {
          updatedAt: now,
        },
        $inc: {
          totalWatchers: 0,
        },
      },
      { upsert: true }
    );
  }

  return { aggregated: job.name };
});

process.on('uncaughtException', (err) => {
  logError('Worker uncaught exception', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logError('Worker unhandled rejection', reason);
  process.exit(1);
});

logInfo('SpotNet workers started');
