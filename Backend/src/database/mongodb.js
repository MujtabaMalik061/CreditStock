import mongoose from 'mongoose';
import { DB_URI } from '../config/env.js';
import Product from '../models/product.model.js';

export default async function connectToDB() {
  if (!DB_URI) throw new Error('Set DB_URI in the backend environment.');
  await mongoose.connect(DB_URI);
  // Replace the legacy global SKU constraint with uniqueness within each shop.
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  const indexes = await Product.collection.indexes();
  const legacy = indexes.find(index => index.unique && Object.keys(index.key).length === 1 && index.key.sku === 1);
  if (legacy) {
    await Product.collection.createIndex({ owner: 1, sku: 1 }, { unique: true });
    await Product.collection.dropIndex(legacy.name);
  }
  console.log('Connected to MongoDB');
}
