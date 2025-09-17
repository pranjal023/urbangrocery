import { Router } from 'express';
import Item from '../models/Item.js';
import { auth, permit } from '../middleware/auth.js';

const r = Router();

// LIST / SEARCH
r.get('/', auth, async (req, res) => {
  const { search, barcode, sku, lowStock } = req.query;
  const q = { isActive: true };
  if (barcode) q.barcode = barcode;
  if (sku) q.sku = sku;
  if (search) q.$text = { $search: search };

  // ✅ at-or-below reorder level (<=) instead of <
  if (lowStock === '1') q.$expr = { $lte: ['$stockQty', '$reorderLevel'] };

  const data = await Item.find(q).sort({ name: 1 }).limit(200);
  res.json(data);
});

// CREATE
r.post('/', auth, permit('manager'), async (req, res) => {
  const created = await Item.create(req.body);
  res.status(201).json(created);
});

// UPDATE (price, name, reorder, etc.)
r.patch('/:id', auth, permit('manager'), async (req, res) => {
  const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// SOFT DELETE
r.delete('/:id', auth, permit('manager'), async (req, res) => {
  await Item.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ ok: true });
});

// ✅ NEW: RESTOCK endpoint (adds to stockQty)
r.post('/:id/restock', auth, permit('manager'), async (req, res) => {
  const qty = Number(req.body.qty || 0);
  if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ error: 'qty must be > 0' });
  const updated = await Item.findByIdAndUpdate(
    req.params.id,
    { $inc: { stockQty: qty } },
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: 'Item not found' });
  res.json(updated);
});

export default r;
