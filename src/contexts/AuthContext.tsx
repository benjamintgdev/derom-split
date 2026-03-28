import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isCeo: boolean;
  isContable: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USERS: (User & { password: string })[] = [
  { id: '1', nombre: 'CEO DEROM', email: 'ceo@derom.com', rol: 'ceo', password: 'admin123' },
  { id: '2', nombre: 'Contable DEROM', email: 'contable@derom.com', rol: 'contable', password: 'contable123' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('derom_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('derom_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('derom_user');
    }
  }, [user]);

  const login = (email: string, password: string): boolean => {
    const found = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isCeo: user?.rol === 'ceo',
      isContable: user?.rol === 'contable',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
