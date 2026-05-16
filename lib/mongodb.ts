import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

function getDatabaseUrl(): string {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MongoDB connection URI. Set DATABASE_URL or MONGODB_URI.');
  }
  return uri;
}

export async function connectToDatabase() {
  if (!client || !db) {
    const databaseUrl = getDatabaseUrl();
    client = new MongoClient(databaseUrl);
    await client.connect();
    db = client.db();
  }
  return { client, db };
}

export { db };
