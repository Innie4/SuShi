import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

let mongod: MongoMemoryServer;

// Connect to the in-memory database before running tests
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

// Clear all data after every test
afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

// Close database connection and stop in-memory server after all tests
afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

// Mock console.error to prevent noise in test output
console.error = jest.fn();
console.warn = jest.fn(); 