import { beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';

const testUri = process.env.TEST_DB_URI;
if (!testUri || !/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(testUri)) {
  throw new Error('Set TEST_DB_URI to a local disposable MongoDB server, e.g. mongodb://127.0.0.1:27019. Tests never use DB_URI.');
}
const database = 'creditstock_auth_test_' + process.pid + '_' + Date.now();
beforeAll(async () => {
  await mongoose.connect(testUri, { dbName: database, serverSelectionTimeoutMS: 5000 });
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
});
afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  await Promise.all(Object.values(mongoose.models).map(model => model.deleteMany({})));
});
afterAll(async () => {
  if (mongoose.connection.name === database) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
