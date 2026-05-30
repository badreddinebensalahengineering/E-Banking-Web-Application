// Backend code reference — displays the Node.js/MySQL backend architecture
// Used in the Admin panel to showcase the full-stack design.

export type BackendFile = {
  name: string;
  language: string;
  description: string;
  code: string;
};

export const backendFiles: BackendFile[] = [
  {
    name: 'database/schema.sql',
    language: 'sql',
    description: 'MySQL schema — users, accounts, transactions, sessions, audit_logs.',
    code: `CREATE DATABASE IF NOT EXISTS nexusbank;
USE nexusbank;

CREATE TABLE users (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  phone         VARCHAR(30),
  address       VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  status        ENUM('active','frozen') NOT NULL DEFAULT 'active',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

CREATE TABLE accounts (
  id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id        CHAR(36) NOT NULL,
  account_number VARCHAR(20) NOT NULL UNIQUE,
  account_type   ENUM('savings','checking','fixed-deposit') NOT NULL DEFAULT 'checking',
  balance        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  currency       CHAR(3) NOT NULL DEFAULT 'USD',
  status         ENUM('active','frozen') NOT NULL DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_account_number (account_number)
);

CREATE TABLE transactions (
  id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  from_account_id     CHAR(36),
  to_account_id       CHAR(36),
  from_account_number VARCHAR(20) NOT NULL,
  to_account_number   VARCHAR(20) NOT NULL,
  amount              DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  type                ENUM('credit','debit','transfer') NOT NULL,
  description         VARCHAR(255),
  category            VARCHAR(50),
  status              ENUM('completed','pending','failed') NOT NULL DEFAULT 'pending',
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (to_account_id)   REFERENCES accounts(id) ON DELETE SET NULL,
  INDEX idx_created (created_at)
);`,
  },
  {
    name: 'server.js',
    language: 'javascript',
    description: 'Express bootstrap — DB pool, session store, middleware, route wiring.',
    code: `require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql   = require('mysql2/promise');

const authRoutes         = require('./routes/auth');
const accountRoutes      = require('./routes/accounts');
const transactionRoutes  = require('./routes/transactions');
const adminRoutes        = require('./routes/admin');
const { requireAuth, requireAdmin } = require('./middleware/auth');

const app = express();
const pool = mysql.createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, saveUninitialized: false,
  store: new MySQLStore({}, pool),
  cookie: { httpOnly: true, secure: true, sameSite: 'lax' },
}));

app.use((req, _res, next) => { req.db = pool; next(); });

app.use('/api/auth',         authRoutes);
app.use('/api/accounts',     requireAuth, accountRoutes);
app.use('/api/transactions', requireAuth, transactionRoutes);
app.use('/api/admin',        requireAuth, requireAdmin, adminRoutes);

app.listen(process.env.PORT || 5000, () => console.log('API ready'));`,
  },
  {
    name: 'routes/auth.js',
    language: 'javascript',
    description: 'Register (with bcrypt hash + welcome bonus), login, logout, /me.',
    code: `router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [[user]] = await req.db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Account not found' });
    if (user.status !== 'active') return res.status(403).json({ error: 'Account frozen' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.userId = user.id;
    const { password_hash, ...safe } = user;
    res.json({ user: safe });
  } catch (e) { next(e); }
});`,
  },
  {
    name: 'routes/accounts.js',
    language: 'javascript',
    description: 'Transfer funds — atomic with SELECT ... FOR UPDATE row locks.',
    code: `router.post('/transfer', async (req, res, next) => {
  const conn = await req.db.getConnection();
  try {
    const { fromAccountId, toAccountNumber, amount } = req.body;
    await conn.beginTransaction();

    const [[fromAcc]] = await conn.query(
      'SELECT * FROM accounts WHERE id = ? FOR UPDATE', [fromAccountId]
    );
    if (fromAcc.balance < amount) throw new Error('Insufficient funds');

    const [[toAcc]] = await conn.query(
      'SELECT * FROM accounts WHERE account_number = ? FOR UPDATE', [toAccountNumber]
    );

    await conn.query('UPDATE accounts SET balance = balance - ? WHERE id = ?',
                     [amount, fromAcc.id]);
    if (toAcc) {
      await conn.query('UPDATE accounts SET balance = balance + ? WHERE id = ?',
                       [amount, toAcc.id]);
    }

    await conn.query(
      \`INSERT INTO transactions (..., amount, type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')\`,
      [/* ... */]
    );

    await conn.commit();
    res.json({ success: true });
  } catch (e) { await conn.rollback(); next(e); }
});`,
  },
  {
    name: 'middleware/auth.js',
    language: 'javascript',
    description: 'requireAuth & requireAdmin guards for protected routes.',
    code: `module.exports.requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

module.exports.requireAdmin = async (req, res, next) => {
  const [[user]] = await req.db.query(
    'SELECT role FROM users WHERE id = ?', [req.session.userId]
  );
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};`,
  },
];

export const apiEndpoints = [
  { method: 'POST',   path: '/api/auth/register',           auth: 'public', purpose: 'Create user + first checking account' },
  { method: 'POST',   path: '/api/auth/login',              auth: 'public', purpose: 'Issue session cookie' },
  { method: 'POST',   path: '/api/auth/logout',             auth: 'user',   purpose: 'Destroy session' },
  { method: 'GET',    path: '/api/auth/me',                 auth: 'user',   purpose: 'Current user profile' },
  { method: 'GET',    path: '/api/accounts',                auth: 'user',   purpose: "List user's accounts" },
  { method: 'POST',   path: '/api/accounts/transfer',       auth: 'user',   purpose: 'Atomic fund transfer (row locks)' },
  { method: 'GET',    path: '/api/transactions',            auth: 'user',   purpose: 'Transaction history' },
  { method: 'GET',    path: '/api/admin/users',             auth: 'admin',  purpose: 'All users' },
  { method: 'GET',    path: '/api/admin/accounts',          auth: 'admin',  purpose: 'All accounts' },
  { method: 'PATCH',  path: '/api/admin/users/:id/status',  auth: 'admin',  purpose: 'Freeze / unfreeze user' },
  { method: 'POST',   path: '/api/admin/accounts/:id/adjust', auth: 'admin', purpose: 'Credit / debit balance' },
  { method: 'DELETE', path: '/api/admin/users/:id',         auth: 'admin',  purpose: 'Delete user (cascade)' },
];
