import { connectToDatabase } from '@/lib/mongodb';
import { getCache, setCache } from '@/lib/redis';
import { ObjectId } from 'mongodb';

const RECOMMENDED_ROOMS_CACHE = 'recommendations:rooms';
const RECOMMENDED_USERS_CACHE = 'recommendations:users';

export async function getRecommendedRooms(userId: string) {
  const cacheKey = `${RECOMMENDED_ROOMS_CACHE}:${userId}`;
  const cached = await getCache<any[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const { db } = await connectToDatabase();
  const recommendations = await db.collection('rooms').aggregate([
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
        watchCount: { $size: '$history' },
        recentActivity: { $max: '$history.watchedAt' },
        userAffinity: { $cond: [{ $in: [new ObjectId(userId), '$members'] }, 1, 0] },
      },
    },
    {
      $sort: {
        userAffinity: -1,
        watchCount: -1,
        recentActivity: -1,
      },
    },
    { $limit: 20 },
  ]).toArray();

  await setCache(cacheKey, recommendations, 60 * 5);
  return recommendations;
}

export async function getRecommendedUsers(userId: string) {
  const cacheKey = `${RECOMMENDED_USERS_CACHE}:${userId}`;
  const cached = await getCache<any[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { friends: 1 } });
  const friendIds = user?.friends || [];

  const suggestions = await db.collection('users').aggregate([
    { $match: { _id: { $nin: [new ObjectId(userId), ...friendIds] }, deleted: { $ne: true } } },
    {
      $addFields: {
        friendCount: { $size: { $ifNull: ['$friends', []] } },
        recentLogin: '$lastSeen',
        engagement: { $size: { $ifNull: ['$watchHistory', []] } },
      },
    },
    { $sort: { engagement: -1, friendCount: -1, recentLogin: -1 } },
    { $limit: 20 },
  ]).toArray();

  await setCache(cacheKey, suggestions, 60 * 5);
  return suggestions;
}

export async function getRecentlyActiveFriends(userId: string) {
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { friends: 1 } });
  const friendIds = user?.friends || [];
  return db.collection('users')
    .find({ _id: { $in: friendIds }, online: true })
    .sort({ lastSeen: -1 })
    .limit(20)
    .toArray();
}
