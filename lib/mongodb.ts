import { MongoClient, Db } from 'mongodb';

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Missing MongoDB connection URI. Set DATABASE_URL or MONGODB_URI.');
}

const databaseUrl: string = uri;

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (!client || !db) {
    client = new MongoClient(databaseUrl);
    await client.connect();
    db = client.db();
  }
  return { client, db };
}

export { db };
