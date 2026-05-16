import { connectToDatabase } from '@/lib/mongodb';
import { getCache, setCache } from '@/lib/redis';

const TRENDING_CACHE_KEY = 'analytics:trending:rooms';
const PEAK_USAGE_CACHE_KEY = 'analytics:peakUsage';
const USER_RETENTION_CACHE_KEY = 'analytics:retention';

export async function getRoomAnalytics() {
  const { db } = await connectToDatabase();
  return db.collection('rooms').aggregate([
    { $match: { deleted: { $ne: true } } },
    {
      $project: {
        name: 1,
        memberCount: { $size: { $ifNull: ['$members', []] } },
        hostId: 1,
        privacy: 1,
        createdAt: 1,
      },
    },
    {
      $lookup: {
        from: 'watchHistory',
        localField: '_id',
        foreignField: 'roomId',
        as: 'history',
      },
    },
    {
      $addFields: {
        views: { $size: '$history' },
        averageWatchTime: { $avg: '$history.watchedDuration' },
      },
    },
    { $sort: { views: -1, memberCount: -1 } },
    { $limit: 50 },
  ]).toArray();
}

export async function getUserAnalytics() {
  const { db } = await connectToDatabase();
  return db.collection('users').aggregate([
    { $match: { deleted: { $ne: true } } },
    {
      $lookup: {
        from: 'watchHistory',
        localField: '_id',
        foreignField: 'userId',
        as: 'history',
      },
    },
    {
      $project: {
        username: 1,
        email: 1,
        online: 1,
        totalWatchTime: { $sum: '$history.watchedDuration' },
        lastSeen: 1,
      },
    },
    { $sort: { totalWatchTime: -1, lastSeen: -1 } },
    { $limit: 50 },
  ]).toArray();
}

export async function getTrendingRooms() {
  const cached = await getCache<any[]>(TRENDING_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const { db } = await connectToDatabase();
  const rooms = await db.collection('rooms').aggregate([
    { $match: { privacy: 'PUBLIC', deleted: { $ne: true } } },
    {
      $lookup: {
        from: 'watchHistory',
        localField: '_id',
        foreignField: 'roomId',
        as: 'history',
      },
    },
    {
      $addFields: {
        activeUsers: { $size: '$members' },
        watchCount: { $size: '$history' },
        watchDuration: { $sum: '$history.watchedDuration' },
        popularityScore: {
          $add: [
            { $size: '$members' },
            { $multiply: [{ $size: '$history' }, 2] },
            { $cond: [{ $gte: ['$createdAt', new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)] }, 10, 0] },
          ],
        },
      },
    },
    { $sort: { popularityScore: -1, watchDuration: -1 } },
    { $limit: 20 },
  ]).toArray();

  await setCache(TRENDING_CACHE_KEY, rooms, 60 * 5);
  return rooms;
}

export async function getActiveUsersAnalytics() {
  const { db } = await connectToDatabase();
  return db.collection('users').aggregate([
    { $match: { online: true } },
    { $project: { username: 1, lastSeen: 1, friends: 1 } },
    { $sort: { lastSeen: -1 } },
    { $limit: 100 },
  ]).toArray();
}

export async function getRetentionAnalytics(days = 30) {
  const cached = await getCache<any>(USER_RETENTION_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const { db } = await connectToDatabase();
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const value = await db.collection('users').aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $lookup: {
        from: 'watchHistory',
        localField: '_id',
        foreignField: 'userId',
        as: 'history',
      },
    },
    {
      $project: {
        username: 1,
        retentionDays: {
          $divide: [{ $subtract: [new Date(), { $min: '$history.watchedAt' }] }, 1000 * 60 * 60 * 24],
        },
      },
    },
    { $sort: { retentionDays: -1 } },
    { $limit: 50 },
  ]).toArray();

  await setCache(USER_RETENTION_CACHE_KEY, value, 60 * 30);
  return value;
}

export async function getWatchDurationAnalytics() {
  const { db } = await connectToDatabase();
  return db.collection('watchHistory').aggregate([
    {
      $group: {
        _id: '$roomId',
        totalWatchDuration: { $sum: '$watchedDuration' },
        sessionCount: { $sum: 1 },
      },
    },
    { $sort: { totalWatchDuration: -1 } },
    { $limit: 50 },
  ]).toArray();
}

export async function getPeakUsage() {
  const cached = await getCache<any>(PEAK_USAGE_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const { db } = await connectToDatabase();
  const result = await db.collection('sessions').aggregate([
    {
      $group: {
        _id: {
          hour: { $hour: '$createdAt' },
          day: { $dayOfWeek: '$createdAt' },
        },
        activeUsers: { $sum: 1 },
      },
    },
    { $sort: { 'activeUsers': -1 } },
    { $limit: 10 },
  ]).toArray();

  await setCache(PEAK_USAGE_CACHE_KEY, result, 60 * 20);
  return result;
}
