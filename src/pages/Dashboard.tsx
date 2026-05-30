import { useAuth } from '../context/AuthContext';
import { useBank } from '../context/BankContext';
import { formatCurrency } from '../lib/mockApi';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  CreditCard,
  PiggyBank,
  Landmark,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const { accounts, transactions } = useBank();
  const [hideBal, setHideBal] = useState(false);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalIn = transactions
    .filter((t) => t.type === 'credit' && accounts.some((a) => a.id === t.toAccountId))
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions
    .filter((t) => (t.type === 'debit' || t.type === 'transfer') && accounts.some((a) => a.id === t.fromAccountId))
    .reduce((s, t) => s + t.amount, 0);

  const recent = transactions.slice(0, 5);

  const accountIcons: Record<string, any> = {
    checking: CreditCard,
    savings: PiggyBank,
    'fixed-deposit': Landmark,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="bank-gradient rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-overlay blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="text-blue-200 text-sm font-medium mb-1">Welcome back,</div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">{user?.fullName.split(' ')[0]} 👋</h1>
            <p className="text-blue-100 max-w-md">
              Here's a snapshot of your finances. Your money is secure and always within reach.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
              <Wallet className="w-4 h-4" />
              Total balance
              <button onClick={() => setHideBal((v) => !v)} className="ml-2">
                {hideBal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-4xl lg:text-5xl font-bold tracking-tight font-mono">
              {hideBal ? '••••••••' : formatCurrency(totalBalance)}
            </div>
            <div className="mt-2 text-xs text-blue-200">
              Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Money in"
          value={hideBal ? '••••••' : formatCurrency(totalIn)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
          sub={`${transactions.filter((t) => t.type === 'credit').length} transactions`}
        />
        <StatCard
          label="Money out"
          value={hideBal ? '••••••' : formatCurrency(totalOut)}
          icon={<TrendingDown className="w-5 h-5" />}
          color="rose"
          sub={`${transactions.filter((t) => t.type !== 'credit').length} transactions`}
        />
        <StatCard
          label="Accounts"
          value={String(accounts.length)}
          icon={<Wallet className="w-5 h-5" />}
          color="blue"
          sub={`${accounts.filter((a) => a.status === 'active').length} active`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Your Accounts</h2>
            <Link
              to="/transfer"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Transfer funds →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((acc) => {
              const Icon = accountIcons[acc.accountType] || Wallet;
              return (
                <div
                  key={acc.id}
                  className="card-gradient text-white rounded-2xl p-5 relative overflow-hidden shadow-xl"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="text-xs uppercase tracking-widest text-blue-200 font-semibold">
                          {acc.accountType}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${acc.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                        {acc.status}
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-mono mb-4">
                      {hideBal ? '••••••••' : formatCurrency(acc.balance, acc.currency)}
                    </div>
                    <div className="text-xs text-blue-200 mb-1">Account number</div>
                    <div className="font-mono text-sm tracking-wider">{acc.accountNumber}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3">
            <QuickAction to="/transfer" label="Send money" icon={<ArrowUpRight className="w-5 h-5" />} />
            <QuickAction to="/transactions" label="History" icon={<Clock className="w-5 h-5" />} />
            <QuickAction to="/transfer" label="Receive" icon={<ArrowDownLeft className="w-5 h-5" />} />
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            <Link
              to="/transactions"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-12">No transactions yet.</div>
          ) : (
            <ul className="space-y-3">
              {recent.map((t) => {
                const isIn = t.type === 'credit';
                return (
                  <li key={t.id} className="flex items-center gap-3">
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
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {t.description}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(t.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-semibold font-mono ${
                        isIn ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isIn ? '+' : '−'}
                      {formatCurrency(t.amount)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'emerald' | 'rose' | 'blue';
  sub: string;
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
  }[color];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors}`}>
          {icon}
        </div>
        <div className="text-sm font-semibold text-slate-600">{label}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900 font-mono">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function QuickAction({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-blue-400 hover:shadow-sm transition"
    >
      <div className="w-10 h-10 rounded-xl bank-gradient text-white flex items-center justify-center">
        {icon}
      </div>
      <span className="text-xs font-semibold text-slate-700">{label}</span>
    </Link>
  );
}
