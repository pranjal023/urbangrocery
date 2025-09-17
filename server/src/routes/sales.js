import { Router } from 'express';
import mongoose from 'mongoose';
import Item from '../models/Item.js';
import Sale from '../models/Sale.js';
import Counter from '../models/Counter.js';
import { auth } from '../middleware/auth.js';
import { round2 } from '../utils/money.js';

const r = Router();

async function nextBillNo(session) {
  const doc = await Counter.findOneAndUpdate(
    { key: 'bill' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );
  return doc.seq;
}

r.post('/', auth, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let saleDoc;
    await session.withTransaction(async () => {
      const { items, payment, notes } = req.body;

      const ids = items.map(i => i.itemId);
      const dbItems = await Item.find({ _id: { $in: ids } }).session(session);

      // Validate stock
      for (const line of items) {
        const dbItem = dbItems.find(d => String(d._id) === line.itemId);
        if (!dbItem) throw new Error(`Item not found: ${line.itemId}`);
        if (dbItem.stockQty < line.qty) throw new Error(`Insufficient stock for ${dbItem.name}`);
      }

      // Build sale lines + totals
      let subtotal = 0, totalTax5 = 0;
      const saleLines = items.map(line => {
        const itm = dbItems.find(d => String(d._id) === line.itemId);
        const lineSubtotal = round2(line.qty * line.unitPrice);
        const tax = itm.taxSlab === 5 ? round2(lineSubtotal * 0.05) : 0;
        subtotal = round2(subtotal + lineSubtotal);
        totalTax5 = round2(totalTax5 + tax);
        return {
          itemId: itm._id, name: itm.name, sku: itm.sku, taxSlab: itm.taxSlab,
          qty: line.qty, unitPrice: line.unitPrice,
          lineSubtotal, taxAmount: tax, lineTotal: round2(lineSubtotal + tax)
        };
      });

      const billNo = await nextBillNo(session);
      const isIntra = String(process.env.INTRA_STATE).toLowerCase() !== 'false';
      const breakup = isIntra
        ? { cgst2_5: round2(totalTax5/2), sgst2_5: round2(totalTax5/2) }
        : { igst5: totalTax5 };

      // Create sale document
      const sale = await Sale.create([{
        billNo,
        cashierId: req.user._id,
        soldAt: new Date(),
        items: saleLines,
        subtotal,
        taxBreakup: breakup,
        total: round2(subtotal + totalTax5),
        payment, notes
      }], { session });

      // ↓↓↓ NEW: decrement stock and collect low-stock alerts ↓↓↓
      const lowAlerts = [];
      for (const line of items) {
        const updated = await Item.findByIdAndUpdate(
          line.itemId,
          { $inc: { stockQty: -line.qty } },
          { new: true, session } // return updated doc
        );
        if (updated && updated.stockQty <= updated.reorderLevel) {
          lowAlerts.push({
            itemId: updated._id,
            name: updated.name,
            stockQty: updated.stockQty,
            reorderLevel: updated.reorderLevel
          });
        }
      }

      // Return the sale plus lowStock array
      saleDoc = sale[0].toObject();
      saleDoc.lowStock = lowAlerts;
      // ↑↑↑ END NEW ↑↑↑
    });

    res.status(201).json(saleDoc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally {
    session.endSession();
  }
});

r.get('/:id', auth, async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) return res.status(404).json({ error: 'Not found' });
  res.json(sale);
});

r.post('/:id/void', auth, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const sale = await Sale.findById(req.params.id).session(session);
      if (!sale) throw new Error('Sale not found');
      if (sale.status !== 'completed') throw new Error('Only completed sales can be voided');

      for (const line of sale.items) {
        await Item.updateOne({ _id: line.itemId }, { $inc: { stockQty: line.qty } }, { session });
      }
      sale.status = 'void';
      await sale.save({ session });
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally { session.endSession(); }
});

export default r;
