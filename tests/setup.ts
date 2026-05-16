import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const rootDir = path.resolve(__dirname, '..');
const envPaths = [
  path.join(rootDir, '.env.test'),
  path.join(rootDir, '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

process.env.MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/spotnet_test';
process.env.DATABASE_URL = process.env.DATABASE_URL || process.env.MONGODB_URI;
process.env.REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.REDIS_URL = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
