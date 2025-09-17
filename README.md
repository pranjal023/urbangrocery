# UrbanGrocery — Pure MERN (No Docker)

A simple POS/billing and inventory system tailored for **UrbanGrocery**.
- Auto-inventory decrement on sale
- GST slabs: **0%** and **5%** (split into CGST 2.5% + SGST 2.5% for intra-state)
- Dynamic UPI QR on receipt
- Top/Least sellers reports
- Pure MERN. Free-tier friendly. Works with MongoDB Atlas.

> Generated on 2025-09-11T08:14:23.263631 UTC

## Quick Start

### 1) Backend
```bash
cd server
cp .env.example .env   # fill values
npm install
npm run dev            # http://localhost:4000
```
- Seed an admin user:
```bash
npm run seed
# user: admin@urbangrocery.local  password: admin123
```

### 2) Frontend
```bash
cd client
npm install
npm run dev            # http://localhost:5173
```

### Env Vars
See **server/.env.example**. For MongoDB Atlas, use connection string from your account.

### Login
- Email: **admin@urbangrocery.local**
- Password: **admin123**

> You can change after first login (basic example only).

## Features
- POS screen (scan/search, cart, tax, QR, print-friendly receipt).
- Inventory CRUD with low-stock filter.
- Reports: Top/Least sellers by qty/revenue and date range.
- Returns/void endpoints (basic).
- JWT auth (roles: manager/cashier).

## Notes
- This is a demo scaffold for interviews and learning—harden before production.
- Rounding is to two decimals; you can adjust in `server/src/utils/money.js`.
