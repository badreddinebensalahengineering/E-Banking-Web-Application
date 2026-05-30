import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, LogIn, UserPlus, Landmark, Lock, Mail, User, Phone, MapPin } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left hero */}
      <div className="bank-gradient relative lg:flex-1 flex items-center justify-center p-8 lg:p-16 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-overlay blur-3xl" />
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-overlay blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">NexusBank</div>
              <div className="text-xs text-blue-200 uppercase tracking-[0.2em]">Secure E-Banking</div>
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Banking reimagined for the digital era.
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Manage your accounts, transfer funds instantly, and track every transaction — all from one secure dashboard.
          </p>
          <div className="space-y-3">
            {[
              'Bank-grade encryption & secure sessions',
              'Real-time transaction notifications',
              '24/7 access from any device',
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-blue-300" />
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-sm">
            <div className="font-semibold mb-2">Demo accounts</div>
            <div className="text-blue-100 space-y-1 font-mono text-xs">
              <div>admin@nexusbank.com / admin123</div>
              <div>demo@nexusbank.com / demo123</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="lg:flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex gap-1 p-1 bg-slate-200 rounded-xl mb-8">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
              }`}
            >
              Create Account
            </button>
          </div>

          {mode === 'login' ? <LoginForm /> : <RegisterForm onDone={() => setMode('login')} />}
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@nexusbank.com');
  const [password, setPassword] = useState('demo123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      setErr(e.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
        <p className="text-slate-500 text-sm mt-1">Sign in to access your accounts.</p>
      </div>

      <Field icon={<Mail className="w-4 h-4" />} label="Email address">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent outline-none placeholder:text-slate-400"
          placeholder="you@example.com"
        />
      </Field>

      <Field icon={<Lock className="w-4 h-4" />} label="Password">
        <input
          type={showPw ? 'text' : 'password'}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-transparent outline-none placeholder:text-slate-400"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShowPw((s) => !s)}
          className="text-slate-400 hover:text-slate-600"
        >
          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </Field>

      {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{err}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bank-gradient text-white font-semibold py-3 rounded-xl hover:opacity-95 transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        <LogIn className="w-4 h-4" />
        {loading ? 'Signing in…' : 'Sign in securely'}
      </button>
    </form>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirm: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const update = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    if (form.password !== form.confirm) {
      setErr('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        password: form.password,
      });
    } catch (e: any) {
      setErr(e.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
        <p className="text-slate-500 text-sm mt-1">Join NexusBank in under a minute.</p>
      </div>

      <Field icon={<User className="w-4 h-4" />} label="Full name">
        <input
          type="text"
          required
          value={form.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          className="w-full bg-transparent outline-none placeholder:text-slate-400"
          placeholder="Jane Doe"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field icon={<Mail className="w-4 h-4" />} label="Email">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full bg-transparent outline-none placeholder:text-slate-400 text-sm"
            placeholder="you@example.com"
          />
        </Field>
        <Field icon={<Phone className="w-4 h-4" />} label="Phone">
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full bg-transparent outline-none placeholder:text-slate-400 text-sm"
            placeholder="+1 555-0100"
          />
        </Field>
      </div>

      <Field icon={<MapPin className="w-4 h-4" />} label="Address">
        <input
          type="text"
          required
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
          className="w-full bg-transparent outline-none placeholder:text-slate-400"
          placeholder="123 Main Street, City"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field icon={<Lock className="w-4 h-4" />} label="Password">
          <input
            type={showPw ? 'text' : 'password'}
            required
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            className="w-full bg-transparent outline-none placeholder:text-slate-400 text-sm"
            placeholder="••••••••"
          />
        </Field>
        <Field icon={<Lock className="w-4 h-4" />} label="Confirm">
          <input
            type={showPw ? 'text' : 'password'}
            required
            value={form.confirm}
            onChange={(e) => update('confirm', e.target.value)}
            className="w-full bg-transparent outline-none placeholder:text-slate-400 text-sm"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="text-slate-400 hover:text-slate-600"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </Field>
      </div>

      {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{err}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bank-gradient text-white font-semibold py-3 rounded-xl hover:opacity-95 transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        <UserPlus className="w-4 h-4" />
        {loading ? 'Creating account…' : 'Create account'}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="w-full text-sm text-slate-500 hover:text-slate-700"
      >
        Already have an account? Sign in
      </button>
    </form>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      <div className="mt-1.5 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition">
        <span className="text-slate-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}
