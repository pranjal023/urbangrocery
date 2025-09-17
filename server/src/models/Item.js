import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  sku: { type: String, unique: true, required: true },
  barcode: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  categoryId: { type: String },
  taxSlab: { type: Number, enum: [0, 5], default: 0 },
  price: { type: Number, required: true },
  stockQty: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

itemSchema.index({ name: 'text' });

export default mongoose.model('Item', itemSchema);
