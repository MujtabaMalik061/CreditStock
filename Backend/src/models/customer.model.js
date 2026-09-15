import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: '' }
}, { timestamps: true });
export default mongoose.model('Customer', schema);
