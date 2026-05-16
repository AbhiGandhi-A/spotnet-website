import { MongoClient, Db } from 'mongodb';

const uri = process.env.DATABASE_URL!;
let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (!client || !db) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
  }
  return { client, db };
}

export { db };
