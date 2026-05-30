// Mock API layer - simulates the Node.js/Express + MySQL backend
// In production, these functions would be REST API calls.

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: 'user' | 'admin';
  createdAt: string;
  status: 'active' | 'frozen';
};

export type Account = {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: 'savings' | 'checking' | 'fixed-deposit';
  balance: number;
  currency: string;
  createdAt: string;
  status: 'active' | 'frozen';
};

export type Transaction = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  type: 'credit' | 'debit' | 'transfer';
  description: string;
  category: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
};

type AuthRecord = {
  userId: string;
  passwordHash: string; // simplified hash
};

const STORAGE_KEYS = {
  users: 'nexus_users',
  accounts: 'nexus_accounts',
  transactions: 'nexus_transactions',
  auth: 'nexus_auth',
  session: 'nexus_session',
};

// --- Simple hash (for demo only; real app uses bcrypt on the server) ---
function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return `h_${Math.abs(h).toString(16)}_${s.length}`;
}

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function accountNumber(): string {
  return '10' + Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
}

// --- Storage helpers ---
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Seed default data ---
export function seedIfEmpty(): void {
  const users = read<User[]>(STORAGE_KEYS.users, []);
  if (users.length > 0) return;

  const adminId = uid('usr');
  const demoId = uid('usr');
  const aliceId = uid('usr');

  const seedUsers: User[] = [
    {
      id: adminId,
      fullName: 'System Administrator',
      email: 'admin@nexusbank.com',
      phone: '+1 555-0100',
      address: '1 Bank Plaza, New York, NY',
      role: 'admin',
      createdAt: new Date().toISOString(),
      status: 'active',
    },
    {
      id: demoId,
      fullName: 'Alex Morgan',
      email: 'demo@nexusbank.com',
      phone: '+1 555-0199',
      address: '42 Market Street, San Francisco, CA',
      role: 'user',
      createdAt: new Date().toISOString(),
      status: 'active',
    },
    {
      id: aliceId,
      fullName: 'Alice Johnson',
      email: 'alice@nexusbank.com',
      phone: '+1 555-0155',
      address: '88 Oak Avenue, Austin, TX',
      role: 'user',
      createdAt: new Date().toISOString(),
      status: 'active',
    },
  ];

  const adminAcc: Account = {
    id: uid('acc'),
    userId: adminId,
    accountNumber: accountNumber(),
    accountType: 'checking',
    balance: 0,
    currency: 'USD',
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  const demoAcc: Account = {
    id: uid('acc'),
    userId: demoId,
    accountNumber: accountNumber(),
    accountType: 'checking',
    balance: 12480.55,
    currency: 'USD',
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  const demoSav: Account = {
    id: uid('acc'),
    userId: demoId,
    accountNumber: accountNumber(),
    accountType: 'savings',
    balance: 34920.18,
    currency: 'USD',
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  const aliceAcc: Account = {
    id: uid('acc'),
    userId: aliceId,
    accountNumber: accountNumber(),
    accountType: 'checking',
    balance: 5200.0,
    currency: 'USD',
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  const now = Date.now();
  const seedTx: Transaction[] = [
    {
      id: uid('tx'),
      fromAccountId: 'external',
      toAccountId: demoAcc.id,
      fromAccountNumber: 'EXTERNAL',
      toAccountNumber: demoAcc.accountNumber,
      amount: 3200.0,
      type: 'credit',
      description: 'Salary — Acme Corp',
      category: 'Income',
      timestamp: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      status: 'completed',
    },
    {
      id: uid('tx'),
      fromAccountId: demoAcc.id,
      toAccountId: 'external',
      fromAccountNumber: demoAcc.accountNumber,
      toAccountNumber: 'EXTERNAL',
      amount: 85.5,
      type: 'debit',
      description: 'Whole Foods Market',
      category: 'Groceries',
      timestamp: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
      status: 'completed',
    },
    {
      id: uid('tx'),
      fromAccountId: demoAcc.id,
      toAccountId: 'external',
      fromAccountNumber: demoAcc.accountNumber,
      toAccountNumber: 'EXTERNAL',
      amount: 14.99,
      type: 'debit',
      description: 'Netflix Subscription',
      category: 'Entertainment',
      timestamp: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
      status: 'completed',
    },
    {
      id: uid('tx'),
      fromAccountId: demoAcc.id,
      toAccountId: aliceAcc.id,
      fromAccountNumber: demoAcc.accountNumber,
      toAccountNumber: aliceAcc.accountNumber,
      amount: 250.0,
      type: 'transfer',
      description: 'Dinner split',
      category: 'Transfer',
      timestamp: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
      status: 'completed',
    },
    {
      id: uid('tx'),
      fromAccountId: 'external',
      toAccountId: demoAcc.id,
      fromAccountNumber: 'EXTERNAL',
      toAccountNumber: demoAcc.accountNumber,
      amount: 500.0,
      type: 'credit',
      description: 'Freelance project payment',
      category: 'Income',
      timestamp: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
      status: 'completed',
    },
  ];

  const seedAuth: AuthRecord[] = [
    { userId: adminId, passwordHash: hash('admin123') },
    { userId: demoId, passwordHash: hash('demo123') },
    { userId: aliceId, passwordHash: hash('alice123') },
  ];

  write(STORAGE_KEYS.users, seedUsers);
  write(STORAGE_KEYS.accounts, [adminAcc, demoAcc, demoSav, aliceAcc]);
  write(STORAGE_KEYS.transactions, seedTx);
  write(STORAGE_KEYS.auth, seedAuth);
}

// --- Auth API ---
export async function apiLogin(email: string, password: string): Promise<{ token: string; user: User }> {
  await delay(400);
  const users = read<User[]>(STORAGE_KEYS.users, []);
  const auth = read<AuthRecord[]>(STORAGE_KEYS.auth, []);
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('Account not found.');
  if (user.status !== 'active') throw new Error('Account is frozen. Contact support.');
  const record = auth.find((a) => a.userId === user.id);
  if (!record || record.passwordHash !== hash(password)) {
    throw new Error('Invalid credentials.');
  }
  const token = `tok_${user.id}_${Date.now()}`;
  write(STORAGE_KEYS.session, { token, userId: user.id });
  return { token, user };
}

export async function apiRegister(data: {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
}): Promise<{ token: string; user: User }> {
  await delay(500);
  const users = read<User[]>(STORAGE_KEYS.users, []);
  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('Email already registered.');
  }
  const newUser: User = {
    id: uid('usr'),
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    role: 'user',
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  const newAcc: Account = {
    id: uid('acc'),
    userId: newUser.id,
    accountNumber: accountNumber(),
    accountType: 'checking',
    balance: 100, // welcome bonus
    currency: 'USD',
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  const welcomeTx: Transaction = {
    id: uid('tx'),
    fromAccountId: 'bank',
    toAccountId: newAcc.id,
    fromAccountNumber: 'NEXUSBANK',
    toAccountNumber: newAcc.accountNumber,
    amount: 100,
    type: 'credit',
    description: 'Welcome bonus',
    category: 'Bonus',
    timestamp: new Date().toISOString(),
    status: 'completed',
  };
  const auth: AuthRecord[] = read<AuthRecord[]>(STORAGE_KEYS.auth, []);
  auth.push({ userId: newUser.id, passwordHash: hash(data.password) });

  write(STORAGE_KEYS.users, [...users, newUser]);
  write(STORAGE_KEYS.accounts, [...read<Account[]>(STORAGE_KEYS.accounts, []), newAcc]);
  write(STORAGE_KEYS.transactions, [...read<Transaction[]>(STORAGE_KEYS.transactions, []), welcomeTx]);
  write(STORAGE_KEYS.auth, auth);

  const token = `tok_${newUser.id}_${Date.now()}`;
  write(STORAGE_KEYS.session, { token, userId: newUser.id });
  return { token, user: newUser };
}

export function apiLogout(): void {
  localStorage.removeItem(STORAGE_KEYS.session);
}

export function apiGetCurrentUser(): User | null {
  const session = read<{ token: string; userId: string } | null>(STORAGE_KEYS.session, null);
  if (!session) return null;
  const users = read<User[]>(STORAGE_KEYS.users, []);
  return users.find((u) => u.id === session.userId) ?? null;
}

// --- Accounts / Transactions ---
export function apiGetAccounts(userId: string): Account[] {
  return read<Account[]>(STORAGE_KEYS.accounts, []).filter((a) => a.userId === userId);
}

export function apiGetAllAccounts(): Account[] {
  return read<Account[]>(STORAGE_KEYS.accounts, []);
}

export function apiGetTransactions(accountIds: string[]): Transaction[] {
  const all = read<Transaction[]>(STORAGE_KEYS.transactions, []);
  const set = new Set(accountIds);
  return all
    .filter((t) => set.has(t.fromAccountId) || set.has(t.toAccountId))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function apiGetAllTransactions(): Transaction[] {
  return read<Transaction[]>(STORAGE_KEYS.transactions, [])
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function apiGetAllUsers(): User[] {
  return read<User[]>(STORAGE_KEYS.users, []);
}

export async function apiTransfer(params: {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  description: string;
}): Promise<Transaction> {
  await delay(700);
  if (params.amount <= 0) throw new Error('Amount must be greater than zero.');

  const accounts = read<Account[]>(STORAGE_KEYS.accounts, []);
  const fromAcc = accounts.find((a) => a.id === params.fromAccountId);
  if (!fromAcc) throw new Error('Source account not found.');
  if (fromAcc.status !== 'active') throw new Error('Source account is frozen.');
  if (fromAcc.balance < params.amount) throw new Error('Insufficient funds.');

  const toAcc = accounts.find((a) => a.accountNumber === params.toAccountNumber);
  const toAccId = toAcc ? toAcc.id : 'external';
  const toAccNum = params.toAccountNumber;

  if (toAcc && toAcc.id === fromAcc.id) throw new Error('Cannot transfer to the same account.');

  // Apply balances
  fromAcc.balance -= params.amount;
  if (toAcc) toAcc.balance += params.amount;
  write(STORAGE_KEYS.accounts, accounts);

  const tx: Transaction = {
    id: uid('tx'),
    fromAccountId: fromAcc.id,
    toAccountId: toAccId,
    fromAccountNumber: fromAcc.accountNumber,
    toAccountNumber: toAccNum,
    amount: params.amount,
    type: toAcc ? 'transfer' : 'debit',
    description: params.description || 'Fund transfer',
    category: 'Transfer',
    timestamp: new Date().toISOString(),
    status: 'completed',
  };

  const txs = read<Transaction[]>(STORAGE_KEYS.transactions, []);
  txs.push(tx);

  // If it's an internal transfer, also create a credit transaction on the receiver side
  if (toAcc) {
    txs.push({
      ...tx,
      id: uid('tx'),
      type: 'credit',
      description: `Received from ${fromAcc.accountNumber} — ${params.description || 'Fund transfer'}`,
    });
  }
  write(STORAGE_KEYS.transactions, txs);
  return tx;
}

// --- Admin ---
export async function apiAdminToggleUserStatus(userId: string): Promise<User> {
  await delay(300);
  const users = read<User[]>(STORAGE_KEYS.users, []);
  const u = users.find((x) => x.id === userId);
  if (!u) throw new Error('User not found.');
  u.status = u.status === 'active' ? 'frozen' : 'active';
  write(STORAGE_KEYS.users, users);

  // Also toggle their accounts
  const accounts = read<Account[]>(STORAGE_KEYS.accounts, []);
  accounts.forEach((a) => {
    if (a.userId === userId) a.status = u.status;
  });
  write(STORAGE_KEYS.accounts, accounts);
  return u;
}

export async function apiAdminAdjustBalance(accountId: string, delta: number): Promise<Account> {
  await delay(300);
  const accounts = read<Account[]>(STORAGE_KEYS.accounts, []);
  const acc = accounts.find((a) => a.id === accountId);
  if (!acc) throw new Error('Account not found.');
  const newBal = acc.balance + delta;
  if (newBal < 0) throw new Error('Balance cannot go negative.');
  acc.balance = newBal;
  write(STORAGE_KEYS.accounts, accounts);

  const tx: Transaction = {
    id: uid('tx'),
    fromAccountId: delta < 0 ? acc.id : 'admin',
    toAccountId: delta > 0 ? acc.id : 'admin',
    fromAccountNumber: delta > 0 ? 'ADMIN_ADJUST' : acc.accountNumber,
    toAccountNumber: delta < 0 ? 'ADMIN_ADJUST' : acc.accountNumber,
    amount: Math.abs(delta),
    type: delta > 0 ? 'credit' : 'debit',
    description: delta > 0 ? 'Admin: Balance credit' : 'Admin: Balance debit',
    category: 'Admin',
    timestamp: new Date().toISOString(),
    status: 'completed',
  };
  const txs = read<Transaction[]>(STORAGE_KEYS.transactions, []);
  txs.push(tx);
  write(STORAGE_KEYS.transactions, txs);
  return acc;
}

export async function apiAdminDeleteUser(userId: string): Promise<void> {
  await delay(300);
  let users = read<User[]>(STORAGE_KEYS.users, []);
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found.');
  if (user.role === 'admin') throw new Error('Cannot delete an administrator.');
  users = users.filter((u) => u.id !== userId);
  write(STORAGE_KEYS.users, users);

  let accounts = read<Account[]>(STORAGE_KEYS.accounts, []);
  const accIds = new Set(accounts.filter((a) => a.userId === userId).map((a) => a.id));
  accounts = accounts.filter((a) => a.userId !== userId);
  write(STORAGE_KEYS.accounts, accounts);

  let txs = read<Transaction[]>(STORAGE_KEYS.transactions, []);
  txs = txs.filter((t) => !accIds.has(t.fromAccountId) && !accIds.has(t.toAccountId));
  write(STORAGE_KEYS.transactions, txs);

  let auth = read<AuthRecord[]>(STORAGE_KEYS.auth, []);
  auth = auth.filter((a) => a.userId !== userId);
  write(STORAGE_KEYS.auth, auth);
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function formatCurrency(n: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
}
