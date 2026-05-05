import { createContext, useState, type ReactNode } from 'react';
import type { User } from '@/types/lms';
import { login as apiLogin } from '@/lib/api/lms';

export interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): User | null {
  try {
    const stored = localStorage.getItem('quip_user');
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

function normalizeUser(user: User): User {
  const first = typeof user.first_name === 'string' ? user.first_name.trim() : '';
  const last = typeof user.last_name === 'string' ? user.last_name.trim() : '';
  const fullName = [first, last].filter(Boolean).join(' ').trim();

  // Do not keep password hashes in local storage.
  const { password: _password, ...safeUser } = user as User & { password?: unknown };

  return {
    ...safeUser,
    name: fullName || safeUser.name,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);

  async function login(email: string, password: string): Promise<void> {
    const userData = await apiLogin({ email, password });
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);
    localStorage.setItem('quip_user', JSON.stringify(normalizedUser));
  }

  function logout(): void {
    setUser(null);
    localStorage.removeItem('quip_user');
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}


