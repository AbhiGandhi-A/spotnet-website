import { connectToDatabase } from '@/lib/mongodb';

async function run() {
  const { db } = await connectToDatabase();

  await db.collection('users').createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { username: 1 }, unique: true },
    { key: { online: 1 } },
    { key: { lastSeen: -1 } },
  ]);

  await db.collection('rooms').createIndexes([
    { key: { privacy: 1 } },
    { key: { active: 1 } },
    { key: { updatedAt: -1 } },
    { key: { hostId: 1 } },
  ]);

  await db.collection('watchHistory').createIndexes([
    { key: { roomId: 1 } },
    { key: { userId: 1 } },
    { key: { watchedAt: -1 } },
  ]);

  await db.collection('notifications').createIndexes([
    { key: { userId: 1 } },
    { key: { createdAt: -1 } },
    { key: { read: 1 } },
  ]);

  await db.collection('sessions').createIndexes([
    { key: { userId: 1 } },
    { key: { active: 1 } },
    { key: { createdAt: -1 } },
  ]);

  await db.collection('securityEvents').createIndexes([
    { key: { userId: 1 } },
    { key: { action: 1 } },
    { key: { createdAt: -1 } },
  ]);

  console.info('Database indexes created successfully');
}

run().catch((err) => {
  console.error('Failed to create indexes', err);
  process.exit(1);
});
