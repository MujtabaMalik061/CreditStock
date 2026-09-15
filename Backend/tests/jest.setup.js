import mongoose from "mongoose";
import connectToDB from "../src/database/mongodb.js";

beforeAll(async () => {
  await connectToDB();
});

afterEach(async () => {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.collections();
  for (const coll of collections) {
    await coll.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});
