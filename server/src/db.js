import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

let connecting = null;

// Safe to call on every request: the connection is created once and reused
// (on Vercel, for as long as the function instance stays warm).
export function connectDB() {
  connecting ??= open().catch((err) => {
    connecting = null; // allow a retry on the next request
    throw err;
  });
  return connecting;
}

async function open() {
  let uri = process.env.MONGO_URI;

  if (!uri) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw new Error('MONGO_URI must be set in production');
    }
    // Development fallback: start a local MongoDB whose data persists in server/.local-db
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.resolve('.local-db');
    fs.mkdirSync(dbPath, { recursive: true });
    const mongod = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: 'wiredTiger' },
    });
    uri = mongod.getUri('archi-dashboard');
    console.log(`MONGO_URI not set - using local dev MongoDB (data in ${dbPath})`);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
}
