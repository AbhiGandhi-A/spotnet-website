import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

function getDatabaseUrl(): string {
  const uri = (
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URI ||
    process.env.MONGOLAB_URI
  )?.trim();
  if (!uri) {
    throw new Error(
      'Missing MongoDB connection URI. Set DATABASE_URL, MONGODB_URI, MONGO_URI, MONGO_URL, DATABASE_URI, or MONGOLAB_URI.'
    );
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
