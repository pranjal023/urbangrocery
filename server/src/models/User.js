import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  name: String,
  role: { type: String, enum: ['manager', 'cashier'], default: 'manager' },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
