import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import connectToDB from './database/mongodb.js';
import { PORT } from './config/env.js';
import productRoutes from './routes/product.routes.js';
import customerRoutes from './routes/customer.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use((error, _req, res, _next) => {
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid record ID' });
  if (error.code === 11000) return res.status(409).json({ message: 'SKU already exists' });
  console.error(error);
  res.status(500).json({ message: 'Something went wrong on the server' });
});
if (process.env.NODE_ENV !== 'test') {
  connectToDB().then(() => app.listen(PORT || 5000, () => console.log('CreditStock API ready')));
}
export default app;
