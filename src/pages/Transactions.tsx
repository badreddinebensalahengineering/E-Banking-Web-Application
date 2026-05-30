import { useState, useMemo } from 'react';
import { useBank } from '../context/BankContext';
import { formatCurrency } from '../lib/mockApi';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  Download,
  Filter,
} from 'lucide-react';

export default function Transactions() {
  const { transactions, accounts } = useBank();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit' | 'transfer'>('all');

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false;
      if (q) {
        const needle = q.toLowerCase();
        return (
          t.description.toLowerCase().includes(needle) ||
          t.category.toLowerCase().includes(needle) ||
          t.fromAccountNumber.includes(needle) ||
          t.toAccountNumber.includes(needle)
        );
      }
      return true;
    });
  }, [transactions, q, filter]);

  const exportCsv = () => {
    const rows = [
      ['Date', 'Type', 'Description', 'Category', 'Amount', 'Status'],
      ...filtered.map((t) => [
        new Date(t.timestamp).toLocaleString(),
        t.type,
        t.description,
        t.category,
        t.amount.toFixed(2),
        t.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} across {accounts.length} account
            {accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-sm font-semibold text-slate-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by description, category, or account…"
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400 mx-1" />
          {(['all', 'credit', 'debit', 'transfer'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition ${
                filter === f
                  ? 'bank-gradient text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No transactions match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Description</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-left px-5 py-3">Account</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const isIn = t.type === 'credit';
                  return (
                    <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                        {new Date(t.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        <div className="text-xs text-slate-400">
                          {new Date(t.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {isIn ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : t.type === 'transfer' ? (
                              <ArrowLeftRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate max-w-xs">
                              {t.description}
                            </div>
                            <div className="text-xs text-slate-500 capitalize">{t.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {isIn ? t.fromAccountNumber : t.toAccountNumber}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block text-xs font-semibold px-2 py-1 rounded-md ${
                            t.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : t.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td
                        className={`px-5 py-4 text-right font-mono font-semibold whitespace-nowrap ${
                          isIn ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isIn ? '+' : '−'}
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
