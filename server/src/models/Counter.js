import mongoose from 'mongoose';
const counterSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  seq: { type: Number, default: 1000 }
});
export default mongoose.model('Counter', counterSchema);
