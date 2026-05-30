import { useState } from 'react';
import { useBank } from '../context/BankContext';
import { formatCurrency } from '../lib/mockApi';
import {
  Users,
  Wallet,
  ShieldAlert,
  Snowflake,
  Unlock,
  Trash2,
  Plus,
  Minus,
  Search,
  Code2,
  Database,
} from 'lucide-react';
import { backendFiles, apiEndpoints } from '../lib/backendReference';

export default function Admin() {
  const {
    allUsers,
    allAccounts,
    allTransactions,
    adminToggleUserStatus,
    adminAdjustBalance,
    adminDeleteUser,
  } = useBank();

  const [tab, setTab] = useState<'users' | 'accounts' | 'transactions' | 'backend'>('users');
const [activeFile, setActiveFile] = useState(backendFiles[0].name);
  const [q, setQ] = useState('');
  const [adjustAcc, setAdjustAcc] = useState<string | null>(null);
  const [adjustAmt, setAdjustAmt] = useState('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [err, setErr] = useState('');

  const totalBal = allAccounts.reduce((s, a) => s + a.balance, 0);
  const activeUsers = allUsers.filter((u) => u.status === 'active').length;
  const frozenAccounts = allAccounts.filter((a) => a.status === 'frozen').length;

  const handleAdjust = async () => {
    if (!adjustAcc) return;
    const amt = parseFloat(adjustAmt);
    if (isNaN(amt) || amt <= 0) {
      setErr('Enter a valid positive amount.');
      return;
    }
    setErr('');
    try {
      await adminAdjustBalance(adjustAcc, adjustType === 'credit' ? amt : -amt);
      setAdjustAcc(null);
      setAdjustAmt('');
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}" and all their data? This cannot be undone.`)) return;
    try {
      await adminDeleteUser(id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-500 text-sm">Manage users, accounts, and system data.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Total users" value={String(allUsers.length)} icon={<Users className="w-4 h-4" />} color="blue" />
        <StatBox label="Active users" value={String(activeUsers)} icon={<Unlock className="w-4 h-4" />} color="emerald" />
        <StatBox label="Total deposits" value={formatCurrency(totalBal)} icon={<Wallet className="w-4 h-4" />} color="indigo" />
        <StatBox label="Frozen accounts" value={String(frozenAccounts)} icon={<Snowflake className="w-4 h-4" />} color="rose" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 flex overflow-x-auto scrollbar-thin">
          {(['users', 'accounts', 'transactions', 'backend'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3.5 text-sm font-semibold capitalize border-b-2 transition whitespace-nowrap ${
                tab === t
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 mb-4 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${tab}…`}
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>

          {err && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {err}
            </div>
          )}

          <div className="overflow-x-auto">
            {tab === 'users' && (
              <UsersTable
                users={allUsers.filter(
                  (u) =>
                    !q ||
                    u.fullName.toLowerCase().includes(q.toLowerCase()) ||
                    u.email.toLowerCase().includes(q.toLowerCase())
                )}
                accounts={allAccounts}
                onToggle={adminToggleUserStatus}
                onDelete={handleDelete}
                onAdjust={(accId) => setAdjustAcc(accId)}
              />
            )}
            {tab === 'accounts' && (
              <AccountsTable
                accounts={allAccounts.filter(
                  (a) => !q || a.accountNumber.includes(q) || a.accountType.includes(q.toLowerCase())
                )}
                users={allUsers}
                onAdjust={(accId) => setAdjustAcc(accId)}
                onToggle={adminToggleUserStatus}
              />
            )}
            {tab === 'transactions' && (
              <TransactionsTable
                txs={allTransactions.filter(
                  (t) =>
                    !q ||
                    t.description.toLowerCase().includes(q.toLowerCase()) ||
                    t.fromAccountNumber.includes(q) ||
                    t.toAccountNumber.includes(q)
                )}
              />
            )}
            {tab === 'backend' && (
              <BackendView
                activeFile={activeFile}
                setActiveFile={setActiveFile}
              />
            )}
          </div>
        </div>
      </div>

      {/* Adjust balance modal */}
      {adjustAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-fade-in">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Adjust balance</h3>
            <p className="text-sm text-slate-500 mb-4">Credit or debit funds to/from the selected account.</p>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setAdjustType('credit')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${
                  adjustType === 'credit'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Plus className="w-4 h-4" /> Credit
              </button>
              <button
                onClick={() => setAdjustType('debit')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${
                  adjustType === 'debit'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Minus className="w-4 h-4" /> Debit
              </button>
            </div>

            <label className="text-xs font-semibold text-slate-600 uppercase">Amount (USD)</label>
            <div className="mt-1.5 flex items-center px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-500">
              <span className="text-slate-400 font-mono mr-2">$</span>
              <input
                type="number"
                step="0.01"
                value={adjustAmt}
                onChange={(e) => setAdjustAmt(e.target.value)}
                className="w-full bg-transparent outline-none font-mono"
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setAdjustAcc(null); setAdjustAmt(''); setErr(''); }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                className="flex-1 py-2.5 rounded-xl bank-gradient text-white font-semibold text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label, value, icon, color,
}: { label: string; value: string; icon: React.ReactNode; color: 'blue' | 'emerald' | 'indigo' | 'rose' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    rose: 'bg-rose-50 text-rose-600',
  }[color];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors} mb-3`}>{icon}</div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-bold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}

function UsersTable({
  users, accounts, onToggle, onDelete, onAdjust,
}: {
  users: any[];
  accounts: any[];
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string, name: string) => void;
  onAdjust: (accId: string) => void;
}) {
  return (
    <table className="w-full text-sm">
      <thead className="text-xs uppercase tracking-wider text-slate-500">
        <tr className="border-b border-slate-200">
          <th className="text-left py-2 px-2">User</th>
          <th className="text-left py-2 px-2">Role</th>
          <th className="text-left py-2 px-2">Status</th>
          <th className="text-left py-2 px-2">Balance</th>
          <th className="text-right py-2 px-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => {
          const userAccs = accounts.filter((a) => a.userId === u.id);
          const bal = userAccs.reduce((s: number, a: any) => s + a.balance, 0);
          return (
            <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-3 px-2">
                <div className="font-semibold text-slate-900">{u.fullName}</div>
                <div className="text-xs text-slate-500">{u.email}</div>
              </td>
              <td className="py-3 px-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    u.role === 'admin'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {u.role}
                </span>
              </td>
              <td className="py-3 px-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    u.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {u.status}
                </span>
              </td>
              <td className="py-3 px-2 font-mono">{formatCurrency(bal)}</td>
              <td className="py-3 px-2">
                <div className="flex items-center justify-end gap-1.5">
                  {u.role !== 'admin' && userAccs[0] && (
                    <button
                      onClick={() => onAdjust(userAccs[0].id)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100"
                    >
                      Adjust
                    </button>
                  )}
                  {u.role !== 'admin' && (
                    <>
                      <button
                        onClick={() => onToggle(u.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100"
                      >
                        {u.status === 'active' ? 'Freeze' : 'Unfreeze'}
                      </button>
                      <button
                        onClick={() => onDelete(u.id, u.fullName)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
        {users.length === 0 && (
          <tr><td colSpan={5} className="text-center py-8 text-slate-500">No users found.</td></tr>
        )}
      </tbody>
    </table>
  );
}

function AccountsTable({
  accounts, users, onAdjust, onToggle,
}: {
  accounts: any[];
  users: any[];
  onAdjust: (accId: string) => void;
  onToggle: (userId: string) => Promise<void>;
}) {
  return (
    <table className="w-full text-sm">
      <thead className="text-xs uppercase tracking-wider text-slate-500">
        <tr className="border-b border-slate-200">
          <th className="text-left py-2 px-2">Account #</th>
          <th className="text-left py-2 px-2">Type</th>
          <th className="text-left py-2 px-2">Owner</th>
          <th className="text-left py-2 px-2">Status</th>
          <th className="text-right py-2 px-2">Balance</th>
          <th className="text-right py-2 px-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {accounts.map((a) => {
          const owner = users.find((u) => u.id === a.userId);
          return (
            <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-3 px-2 font-mono text-xs">{a.accountNumber}</td>
              <td className="py-3 px-2 capitalize">{a.accountType}</td>
              <td className="py-3 px-2">
                <div className="font-semibold text-slate-900">{owner?.fullName ?? '—'}</div>
                <div className="text-xs text-slate-500">{owner?.email}</div>
              </td>
              <td className="py-3 px-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    a.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {a.status}
                </span>
              </td>
              <td className="py-3 px-2 text-right font-mono">{formatCurrency(a.balance)}</td>
              <td className="py-3 px-2">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onAdjust(a.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100"
                  >
                    Adjust
                  </button>
                  {owner?.role !== 'admin' && (
                    <button
                      onClick={() => owner && onToggle(owner.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100"
                    >
                      {a.status === 'active' ? 'Freeze' : 'Unfreeze'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
        {accounts.length === 0 && (
          <tr><td colSpan={6} className="text-center py-8 text-slate-500">No accounts.</td></tr>
        )}
      </tbody>
    </table>
  );
}

function BackendView({
  activeFile,
  setActiveFile,
}: {
  activeFile: string;
  setActiveFile: (s: string) => void;
}) {
  const file = backendFiles.find((f) => f.name === activeFile) || backendFiles[0];
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
        <Code2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-indigo-900">Backend architecture</div>
          <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
            This frontend is paired with a production Node.js + Express + MySQL REST API. Below are the key source files.
            In this demo, all API calls are simulated via <code className="font-mono bg-white px-1 rounded">src/lib/mockApi.ts</code>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> Source files
          </div>
          {backendFiles.map((f) => (
            <button
              key={f.name}
              onClick={() => setActiveFile(f.name)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition ${
                activeFile === f.name
                  ? 'bg-slate-900 text-emerald-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-xl bg-slate-900 text-slate-100 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs font-mono text-slate-400 ml-2">{file.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{file.language}</span>
            </div>
            <div className="px-4 py-3 text-xs text-slate-300 border-b border-slate-800 bg-slate-800/50">
              {file.description}
            </div>
            <pre className="p-4 text-xs overflow-x-auto font-mono leading-relaxed max-h-96 overflow-y-auto scrollbar-thin">
              <code>{file.code}</code>
            </pre>
          </div>

          {file.name === 'database/schema.sql' && (
            <div className="mt-4">
              <div className="text-sm font-bold text-slate-900 mb-2">REST API endpoints</div>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-3 py-2">Method</th>
                      <th className="text-left px-3 py-2">Endpoint</th>
                      <th className="text-left px-3 py-2">Auth</th>
                      <th className="text-left px-3 py-2">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiEndpoints.map((e) => (
                      <tr key={e.path + e.method} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              e.method === 'GET'
                                ? 'bg-emerald-50 text-emerald-700'
                                : e.method === 'POST'
                                ? 'bg-blue-50 text-blue-700'
                                : e.method === 'PATCH'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {e.method}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-900">{e.path}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              e.auth === 'public'
                                ? 'bg-slate-100 text-slate-700'
                                : e.auth === 'admin'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {e.auth}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{e.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionsTable({ txs }: { txs: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-xs uppercase tracking-wider text-slate-500">
        <tr className="border-b border-slate-200">
          <th className="text-left py-2 px-2">Date</th>
          <th className="text-left py-2 px-2">From</th>
          <th className="text-left py-2 px-2">To</th>
          <th className="text-left py-2 px-2">Description</th>
          <th className="text-left py-2 px-2">Type</th>
          <th className="text-right py-2 px-2">Amount</th>
        </tr>
      </thead>
      <tbody>
        {txs.map((t) => (
          <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
            <td className="py-3 px-2 text-xs text-slate-600">
              {new Date(t.timestamp).toLocaleString()}
            </td>
            <td className="py-3 px-2 font-mono text-xs">{t.fromAccountNumber}</td>
            <td className="py-3 px-2 font-mono text-xs">{t.toAccountNumber}</td>
            <td className="py-3 px-2">{t.description}</td>
            <td className="py-3 px-2 capitalize text-xs">{t.type}</td>
            <td className="py-3 px-2 text-right font-mono">{formatCurrency(t.amount)}</td>
          </tr>
        ))}
        {txs.length === 0 && (
          <tr><td colSpan={6} className="text-center py-8 text-slate-500">No transactions.</td></tr>
        )}
      </tbody>
    </table>
  );
}
