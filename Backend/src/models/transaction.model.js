import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['sale', 'payment', 'stock'], required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  quantity: { type: Number, min: 1 },
  total: { type: Number, min: 0 },
  unitCost: { type: Number, min: 0 },
  paid: { type: Number, min: 0 },
  amount: { type: Number },
  note: { type: String, trim: true, default: '' }
}, { timestamps: true });
schema.index({ createdAt: -1 });
schema.index({ customer: 1, createdAt: -1 });
export default mongoose.model('Transaction', schema);
