import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import salesRoutes from './routes/sales.js';
import reportRoutes from './routes/reports.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => res.json({ ok: true, name: 'UrbanGrocery API' }));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);

const allow = process.env.CORS_ORIGIN?.split(',').map(s=>s.trim()).filter(Boolean)
app.use(cors({
  origin: (origin, cb) => {
    if (!allow || allow.length === 0 || !origin) return cb(null, true)
    return allow.includes(origin) ? cb(null, true) : cb(new Error('CORS blocked'))
  }
}))

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Server error' });
});

export default app;
