# UrbanGrocery 

A simple POS/billing and inventory system  **UrbanGrocery**.


## Features
- POS screen (scan/search, cart, tax, QR, print-friendly receipt).
- Inventory CRUD with low-stock filter.
- Reports: Top/Least sellers by qty/revenue and date range.
- Returns/void endpoints (basic).
- JWT auth (roles: manager/cashier).

## Notes
- This is a demo scaffold for interviews and learning—harden before production.
- Rounding is to two decimals; you can adjust in `server/src/utils/money.js`.
