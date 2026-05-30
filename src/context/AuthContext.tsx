import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, apiLogin, apiRegister, apiLogout, apiGetCurrentUser } from '../lib/mockApi';

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = apiGetCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  const login: AuthState['login'] = async (email, password) => {
    const res = await apiLogin(email, password);
    setUser(res.user);
  };

  const register: AuthState['register'] = async (data) => {
    const res = await apiRegister(data);
    setUser(res.user);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
