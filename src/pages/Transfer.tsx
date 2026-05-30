import { useState, FormEvent } from 'react';
import { useBank } from '../context/BankContext';
import { formatCurrency } from '../lib/mockApi';
import { ArrowLeftRight, CheckCircle2, AlertCircle, Wallet } from 'lucide-react';

export default function Transfer() {
  const { accounts, transfer } = useBank();
  const [fromId, setFromId] = useState(accounts[0]?.id ?? '');
  const [toNum, setToNum] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.status === 'active');
  const fromAcc = accounts.find((a) => a.id === fromId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setSuccess(null);
    const amt = parseFloat(amount);
    if (!fromId) { setErr('Select a source account.'); return; }
    if (!toNum || toNum.length < 6) { setErr('Enter a valid account number.'); return; }
    if (!amt || amt <= 0) { setErr('Enter a valid amount.'); return; }

    setLoading(true);
    try {
      await transfer({
        fromAccountId: fromId,
        toAccountNumber: toNum,
        amount: amt,
        description: desc || 'Fund transfer',
      });
      setSuccess(`Successfully transferred ${formatCurrency(amt)} to ${toNum}.`);
      setAmount('');
      setDesc('');
      setToNum('');
    } catch (e: any) {
      setErr(e.message || 'Transfer failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transfer Funds</h1>
        <p className="text-slate-500 text-sm mt-1">Send money instantly to any NexusBank account.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={submit} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              From account
            </label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="mt-1.5 w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            >
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountType.toUpperCase()} ••••{a.accountNumber.slice(-4)} — {formatCurrency(a.balance)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Recipient account number
            </label>
            <input
              type="text"
              value={toNum}
              onChange={(e) => setToNum(e.target.value.replace(/\D/g, ''))}
              placeholder="1234567890"
              className="mt-1.5 w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-mono tracking-wider"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Amount (USD)
            </label>
            <div className="mt-1.5 flex items-center px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <span className="text-slate-400 font-mono mr-2">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent outline-none font-mono text-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Description (optional)
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Rent, groceries, gift…"
              className="mt-1.5 w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {err && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bank-gradient text-white font-semibold py-3.5 rounded-xl hover:opacity-95 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            {loading ? 'Processing…' : 'Send transfer'}
          </button>

          <p className="text-xs text-slate-500 text-center">
            🔒 Transfers are encrypted end-to-end. Daily limit: $50,000.
          </p>
        </form>

        {/* Sidebar summary */}
        <div className="space-y-4">
          <div className="bank-gradient rounded-2xl p-5 text-white">
            <div className="text-blue-200 text-xs uppercase tracking-widest mb-2">Available balance</div>
            <div className="text-3xl font-bold font-mono">
              {fromAcc ? formatCurrency(fromAcc.balance) : '$0.00'}
            </div>
            <div className="text-xs text-blue-200 mt-2 font-mono">
              {fromAcc?.accountNumber || '—'}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-900">Known recipients</h3>
            </div>
            <ul className="text-xs text-slate-600 space-y-2">
              {accounts
                .filter((a) => a.id !== fromId && a.status === 'active')
                .slice(0, 3)
                .map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setToNum(a.accountNumber)}
                      className="w-full text-left px-2 py-1.5 rounded-md hover:bg-blue-50 transition"
                    >
                      <div className="font-semibold text-slate-800">{a.accountType}</div>
                      <div className="font-mono text-slate-500">{a.accountNumber}</div>
                    </button>
                  </li>
                ))}
              {accounts.filter((a) => a.id !== fromId).length === 0 && (
                <li className="text-slate-400 italic">No other accounts to transfer to.</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-900">Quick tips</h3>
            </div>
            <ul className="text-xs text-slate-600 space-y-2">
              <li>• Verify the recipient account number before sending.</li>
              <li>• Internal transfers are instant and free.</li>
              <li>• External transfers may take 1–2 business days.</li>
              <li>• You'll receive a receipt via email.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
