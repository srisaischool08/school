import { createContext, useContext, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('srisai-token') || sessionStorage.getItem('srisai-token') || '');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('srisai-user') || sessionStorage.getItem('srisai-user') || 'null'));

  const login = async ({ username, password, role, remember = true }) => {
    const response = await api.post('/auth/login', { username, password, role });
    const nextToken = response.data.token;
    const nextUser = response.data.user;

    setToken(nextToken);
    setUser(nextUser);
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    storage.setItem('srisai-token', nextToken);
    storage.setItem('srisai-user', JSON.stringify(nextUser));
    otherStorage.removeItem('srisai-token');
    otherStorage.removeItem('srisai-user');
    return response.data;
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('srisai-token');
    localStorage.removeItem('srisai-user');
    sessionStorage.removeItem('srisai-token');
    sessionStorage.removeItem('srisai-user');
  };

  const value = useMemo(() => ({ token, user, login, logout, isAuthenticated: Boolean(token) }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
