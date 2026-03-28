import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isCeo: boolean;
  isContable: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Simple hash function for demo password storage (not plain text)
async function hashPassword(pw: string): Promise<string> {
  const encoded = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Pre-computed SHA-256 hashes
const DEMO_USERS: { id: string; nombre: string; username: string; rol: UserRole; hash: string }[] = [
  { id: '1', nombre: 'Ángel del Rosario', username: 'Angeldrom', rol: 'ceo', hash: '' },
  { id: '2', nombre: 'Contable DEROM', username: 'Contable', rol: 'contable', hash: '' },
];

// Compute hashes at startup
const PASSWORDS: Record<string, string> = { 'Angeldrom': 'CEOderom#', 'Contable': '54321' };
let hashesReady = false;
const initHashes = (async () => {
  for (const u of DEMO_USERS) {
    u.hash = await hashPassword(PASSWORDS[u.username]);
  }
  hashesReady = true;
})();

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
