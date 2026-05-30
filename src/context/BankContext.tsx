import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import {
  Account,
  Transaction,
  User,
  apiGetAccounts,
  apiGetTransactions,
  apiTransfer,
  apiAdminAdjustBalance,
  apiAdminDeleteUser,
  apiAdminToggleUserStatus,
  apiGetAllAccounts,
  apiGetAllTransactions,
  apiGetAllUsers,
} from '../lib/mockApi';
import { useAuth } from './AuthContext';

type BankState = {
  accounts: Account[];
  transactions: Transaction[];
  allUsers: User[];
  allAccounts: Account[];
  allTransactions: Transaction[];
  refresh: () => void;
  transfer: (params: {
    fromAccountId: string;
    toAccountNumber: string;
    amount: number;
    description: string;
  }) => Promise<Transaction>;
  adminToggleUserStatus: (userId: string) => Promise<void>;
  adminAdjustBalance: (accountId: string, delta: number) => Promise<void>;
  adminDeleteUser: (userId: string) => Promise<void>;
};

const BankContext = createContext<BankState | undefined>(undefined);

export function BankProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  const refresh = useCallback(() => {
    if (!user) {
      setAccounts([]);
      setTransactions([]);
      setAllUsers([]);
      setAllAccounts([]);
      setAllTransactions([]);
      return;
    }
    const accs = apiGetAccounts(user.id);
    setAccounts(accs);
    setTransactions(apiGetTransactions(accs.map((a) => a.id)));

    if (user.role === 'admin') {
      setAllUsers(apiGetAllUsers());
      setAllAccounts(apiGetAllAccounts());
      setAllTransactions(apiGetAllTransactions());
    } else {
      setAllUsers([]);
      setAllAccounts([]);
      setAllTransactions([]);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const transfer: BankState['transfer'] = async (params) => {
    const tx = await apiTransfer(params);
    refresh();
    return tx;
  };

  const adminToggleUserStatus: BankState['adminToggleUserStatus'] = async (userId) => {
    await apiAdminToggleUserStatus(userId);
    refresh();
  };

  const adminAdjustBalance: BankState['adminAdjustBalance'] = async (accountId, delta) => {
    await apiAdminAdjustBalance(accountId, delta);
    refresh();
  };

  const adminDeleteUser: BankState['adminDeleteUser'] = async (userId) => {
    await apiAdminDeleteUser(userId);
    refresh();
  };

  return (
    <BankContext.Provider
      value={{
        accounts,
        transactions,
        allUsers,
        allAccounts,
        allTransactions,
        refresh,
        transfer,
        adminToggleUserStatus,
        adminAdjustBalance,
        adminDeleteUser,
      }}
    >
      {children}
    </BankContext.Provider>
  );
}

export function useBank() {
  const ctx = useContext(BankContext);
  if (!ctx) throw new Error('useBank must be used inside BankProvider');
  return ctx;
}
