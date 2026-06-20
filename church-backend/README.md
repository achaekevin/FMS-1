#   Grace Life Financial Management System — Backend API

A production-ready REST API for managing Grace life finances: income, expenses, funds, member contributions, M-Pesa payments, reports, and audit logs.

## Tech Stack

- **Runtime:** Node.js + Express.js
- **ORM:** Sequelize (MySQL)
- **Auth:** JWT + bcrypt
- **Uploads:** Multer
- **Exports:** PDFKit (PDF), ExcelJS (Excel)
- **Logging:** Winston (daily rotating files)
- **Docs:** Swagger / OpenAPI 3
- **Validation:** express-validator
- **Security:** Helmet, CORS, rate limiting

## Project Structure

```
backend/
├── config/          # DB config, Sequelize instance, Swagger spec
├── controllers/      # Request handlers (business logic)
├── middleware/        # auth, validation, error handling, uploads, logging
├── models/           # Sequelize models + associations
├── migrations/        # Sequelize migrations (schema)
├── seeders/          # Demo data seeders
├── routes/           # Express routers per resource
├── services/         # Reusable logic: audit, funds, M-Pesa, PDF, Excel
├── utils/            # Logger, response helpers, date/pagination helpers
├── logs/             # Winston log output (gitignored)
├── uploads/          # Receipt/file uploads (gitignored)
├── app.js            # Express app (middleware + routes)
└── server.js          # Entry point — connects DB, starts server
```

## Setup

```bash
npm install
cp .env.example .env   # then edit DB credentials, JWT secret, M-Pesa keys

# Create database first: CREATE DATABASE church_finance;

npm run migrate        # run all migrations
npm run seed            # seed the 3 login accounts + 4 funds (zero balances, no transactions)
npm run dev             # start with nodemon
```

API runs at `http://localhost:5000`. Swagger docs at `http://localhost:5000/api-docs`.

## Demo Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Administrator | admin@gacelife.org | GLC@dmin2024! |
| Pastor | pastor@gracelife.org | GLC@pastor2024! |
| Treasurer |treasurer@gracelife.org| GLC@Treasurer2024! |

## Clean-Slate Data

The seeders only create **structural** data: the three accounts above, and the four standard funds (General, Building, Welfare, Mission) at a KES 0.00 balance. No members, income, expenses, M-Pesa transactions, or audit log entries are seeded — the database starts genuinely empty so you can demo the system from a real zero state. Fund balances populate automatically as you record income/expenses through the API (see `services/fundService.js`).

## Roles & Permissions

- **Administrator:** full access to everything, including user management and fund creation.
- **Pastor:** view dashboard, income, expenses, members, reports, funds; approve expenses.
- **Treasurer:** manage income/expenses, members, M-Pesa, exports, audit logs, reports.

Enforced via `middleware/auth.js` (`adminOnly`, `adminOrPastor`, `adminOrTreasurer`, `allRoles`).

## Key API Endpoints

### Auth
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/change-password
```

### Members
```
GET    /api/members?search=&status=&page=&limit=
GET    /api/members/:id
GET    /api/members/:id/contributions?startDate=&endDate=&month=&year=
POST   /api/members
PUT    /api/members/:id
DELETE /api/members/:id
```

### Income (Tithes / Offerings / Donations)
```
GET    /api/income?type=&paymentMethod=&fundId=&startDate=&endDate=&search=
GET    /api/income/summary
GET    /api/income/:id
POST   /api/income
PUT    /api/income/:id
DELETE /api/income/:id
```

### Expenses
```
GET    /api/expenses?category=&fundId=&startDate=&endDate=
GET    /api/expenses/summary
POST   /api/expenses          (multipart/form-data, field: receipt)
PUT    /api/expenses/:id
DELETE /api/expenses/:id
```

### Funds
```
GET    /api/funds
GET    /api/funds/:id
GET    /api/funds/:id/report?startDate=&endDate=
POST   /api/funds              (admin only)
PUT    /api/funds/:id          (admin only)
DELETE /api/funds/:id          (admin only)
```

### Reports
```
GET /api/reports/income?startDate=&endDate=&month=&year=&format=pdf|excel
GET /api/reports/expenses?...&format=pdf|excel
GET /api/reports/funds?...
GET /api/reports/contributions?...&format=excel
GET /api/reports/member/:id/statement   (PDF statement)
```

### M-Pesa (Daraja)
```
POST /api/mpesa/stkpush        { phone, amount, memberId?, category, description }
POST /api/mpesa/callback        (public — Safaricom calls this)
GET  /api/mpesa/status/:checkoutRequestId
GET  /api/mpesa/transactions
```

### Dashboard
```
GET /api/dashboard/stats
GET /api/dashboard/monthly-stats?months=8
GET /api/dashboard/recent-transactions?limit=10
GET /api/dashboard/fund-overview
```

### Audit Logs
```
GET /api/audit?userId=&action=&module=&startDate=&endDate=
GET /api/audit/:id
```

## Fund Balance Automation

`services/fundService.js` automatically credits a fund's balance when income is recorded against it, and debits it when an expense is recorded — wrapped in a Sequelize transaction so the ledger entry and balance update are atomic. Deleting or editing a record reverses the previous effect before applying the new one.

## Audit Trail

Every create/update/delete/login/export/M-Pesa action calls `services/auditService.js`, which writes a row to `audit_logs` with the acting user, action, module, description, IP, and user agent.

## M-Pesa Flow

1. Client calls `POST /mpesa/stkpush` → backend requests a Daraja OAuth token, sends the STK push, stores a `pending` transaction with `CheckoutRequestID`.
2. Safaricom calls `POST /mpesa/callback` asynchronously with the result. On success, the transaction is marked `completed`, the M-Pesa receipt number is stored, and an `Income` record is auto-created.
3. Client polls `GET /mpesa/status/:checkoutRequestId` — if still pending in the DB, the backend actively queries Daraja's `stkpushquery` endpoint for the latest status.

## Error Handling

All errors flow through `middleware/errorHandler.js`, which normalizes Sequelize validation/unique/FK errors, JWT errors, and Multer file-size errors into a consistent `{ success: false, message, errors? }` JSON shape.

## Logging

Winston writes daily rotating logs to `logs/app-*.log` (info+) and `logs/error-*.log` (errors only), plus console output in development. `middleware/requestLogger.js` logs every request's method, path, status, and duration.
