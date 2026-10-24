import { MongoMemoryServer } from 'mongodb-memory-server';

// One in-memory mongod for the whole run; suites connect through MONGODB_URI.
export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  (globalThis as { __MONGOD__?: MongoMemoryServer }).__MONGOD__ = mongod;
}
