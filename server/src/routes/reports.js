import { Router } from 'express';
import Sale from '../models/Sale.js';
import { auth } from '../middleware/auth.js';

const r = Router();

r.get('/top-sellers', auth, async (req, res) => {
  const { from, to, limit = 10, by = 'qty' } = req.query;
  const metric = by === 'revenue' ? '$items.lineTotal' : '$items.qty';
  const rows = await Sale.aggregate([
    { $match: { soldAt: { $gte: new Date(from), $lte: new Date(to) }, status: 'completed' } },
    { $unwind: '$items' },
    { $group: { _id: '$items.itemId', name: { $last: '$items.name' }, qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.lineTotal' } } },
    { $sort: by === 'revenue' ? { revenue: -1 } : { qty: -1 } },
    { $limit: Number(limit) }
  ]);
  res.json(rows);
});

r.get('/least-sellers', auth, async (req, res) => {
  const { from, to, limit = 10, by = 'qty' } = req.query;
  const rows = await Sale.aggregate([
    { $match: { soldAt: { $gte: new Date(from), $lte: new Date(to) }, status: 'completed' } },
    { $unwind: '$items' },
    { $group: { _id: '$items.itemId', name: { $last: '$items.name' }, qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.lineTotal' } } },
    { $sort: by === 'revenue' ? { revenue: 1 } : { qty: 1 } },
    { $limit: Number(limit) }
  ]);
  res.json(rows);
});

r.get('/summary/day', auth, async (req, res) => {
  const { date } = req.query; // YYYY-MM-DD
  const d0 = new Date(date + 'T00:00:00.000Z');
  const d1 = new Date(date + 'T23:59:59.999Z');
  const rows = await Sale.aggregate([
    { $match: { soldAt: { $gte: d0, $lte: d1 }, status: 'completed' } },
    { $group: {
      _id: null,
      bills: { $sum: 1 },
      items: { $sum: { $sum: '$items.qty' } },
      subtotal: { $sum: '$subtotal' },
      cgst2_5: { $sum: '$taxBreakup.cgst2_5' },
      sgst2_5: { $sum: '$taxBreakup.sgst2_5' },
      igst5: { $sum: '$taxBreakup.igst5' },
      total: { $sum: '$total' }
    }}
  ]);
  res.json(rows[0] || {});
});


r.get('/daily-total', auth, async (req, res) => {
  let { from, to } = req.query;

  let start, end;
  if (from && to) {
    start = new Date(from);
    end = new Date(to);
  } else {
    const now = new Date();
    start = new Date(now); start.setHours(0,0,0,0);
    end   = new Date(now); end.setHours(23,59,59,999);
  }

  const match = { soldAt: { $gte: start, $lte: end } };

  const [grand] = await Sale.aggregate([
    { $match: match },
    { $group: {
        _id: null,
        total: { $sum: '$total' },
        bills: { $sum: 1 },
        subtotal: { $sum: '$subtotal' }
      } }
  ]);

  const byMode = await Sale.aggregate([
    { $match: match },
    { $group: {
        _id: '$payment.mode',
        amount: { $sum: '$total' },
        count: { $sum: 1 }
      } },
    { $project: { _id: 0, mode: '$_id', amount: 1, count: 1 } }
  ]);

  const total = +(grand?.total || 0).toFixed(2);
  const bills = grand?.bills || 0;
  const avgBill = bills ? +(total / bills).toFixed(2) : 0;

  res.json({ total, bills, avgBill, byMode });
});

export default r;
