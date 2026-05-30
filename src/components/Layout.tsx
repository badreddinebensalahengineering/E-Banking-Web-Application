import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  ShieldCheck,
  Landmark,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transfer', label: 'Transfer', icon: ArrowLeftRight },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
    ...(user.role === 'admin'
      ? [{ to: '/admin', label: 'Admin Panel', icon: ShieldCheck }]
      : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 bank-gradient text-white flex-col">
        <SidebarContent links={links} user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="relative w-64 bank-gradient text-white flex flex-col animate-fade-in">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent links={links} user={user} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="lg:hidden flex items-center gap-2">
                <Landmark className="w-5 h-5 text-blue-900" />
                <span className="font-bold text-blue-900">NexusBank</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">{user.fullName}</div>
                <div className="text-xs text-slate-500">
                  {user.role === 'admin' ? 'Administrator' : 'Account holder'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bank-gradient text-white flex items-center justify-center font-semibold text-sm">
                {user.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  links,
  user,
  onLogout,
}: {
  links: { to: string; label: string; icon: any }[];
  user: any;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
          <Landmark className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-lg">NexusBank</div>
          <div className="text-[10px] text-blue-200 uppercase tracking-widest">Secure Banking</div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-inner'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <l.icon className="w-4 h-4" />
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold">
              {user.fullName
                .split(' ')
                .map((n: string) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{user.fullName}</div>
              <div className="text-xs text-blue-200 truncate">{user.email}</div>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  );
}
