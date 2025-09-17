import './setup.js';
import { connectDB } from './setup.js';
import User from './models/User.js';
import Item from './models/Item.js';
import bcrypt from 'bcryptjs';

await connectDB();
const passwordHash = await bcrypt.hash('admin123', 10);
await User.findOneAndUpdate(
  { email: 'admin@urbangrocery.local' },
  { email: 'admin@urbangrocery.local', name: 'Admin', role: 'manager', passwordHash },
  { upsert: true, new: true }
);
await Item.insertMany([
  { sku: 'MILK500', name: 'Milk 500ml', price: 30, taxSlab: 0, stockQty: 50, reorderLevel: 10 },
  { sku: 'BREAD', name: 'Bread 400g', price: 40, taxSlab: 5, stockQty: 30, reorderLevel: 8 },
  { sku: 'EGG12', name: 'Eggs (12)', price: 70, taxSlab: 0, stockQty: 20, reorderLevel: 6 }
], { ordered: false }).catch(()=>{});
console.log('Seed complete. User: admin@urbangrocery.local / admin123');
process.exit(0);
