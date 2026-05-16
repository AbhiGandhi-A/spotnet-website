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
    // If an explicit DB name is provided via env, use it. Otherwise use the
    // database name from the connection string if present; if the connection
    // string did not include a DB (driver defaults to 'test'), fall back to
    // the 'spotnet' database.
    const envDb = (
      process.env.MONGODB_DB ||
      process.env.DATABASE_DB ||
      process.env.MONGO_DB ||
      process.env.DATABASE_NAME
    )?.trim();

    if (envDb) {
      db = client.db(envDb);
    } else {
      const inferred = client.db().databaseName;
      if (inferred && inferred !== 'test') {
        db = client.db(inferred);
      } else {
        db = client.db('spotnet');
      }
    }
  }
  return { client, db };
}

export { db };
