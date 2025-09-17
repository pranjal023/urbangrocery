import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  name: String,
  sku: String,
  taxSlab: { type: Number, enum: [0,5], default: 0 },
  qty: Number,
  unitPrice: Number,
  lineSubtotal: Number,
  taxAmount: Number,
  lineTotal: Number
}, { _id: false });

const saleSchema = new mongoose.Schema({
  billNo: { type: Number, index: true },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerId: { type: String },
  soldAt: { type: Date, default: () => new Date() },
  items: [saleItemSchema],
  subtotal: Number,
  taxBreakup: {
    cgst2_5: { type: Number, default: 0 },
    sgst2_5: { type: Number, default: 0 },
    igst5: { type: Number, default: 0 }
  },
  total: Number,
  payment: {
    mode: { type: String, enum: ['cash','upi','card','mixed'], default: 'cash' },
    upiTxnId: String,
    qrPayload: String
  },
  notes: String,
  status: { type: String, enum: ['completed','void','returned'], default: 'completed' }
}, { timestamps: true });

saleSchema.index({ soldAt: -1 });
saleSchema.index({ 'items.itemId': 1 });

export default mongoose.model('Sale', saleSchema);
