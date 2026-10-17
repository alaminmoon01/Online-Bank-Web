import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const token = localStorage.getItem('sb_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api('/auth/me', { auth: true });
      setUser(data.user);
    } catch {
      localStorage.removeItem('sb_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(payload) {
    const data = await api('/auth/login', { method: 'POST', body: payload });
    if (data.requiresOTP || data.requires2FA || !data.token) return data;
    localStorage.setItem('sb_token', data.token);
    setUser(data.user);
    return data;
  }

  async function register(payload) {
    return api('/auth/register', { method: 'POST', body: payload });
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST', auth: true });
    } catch {
      /* ignore */
    }
    localStorage.removeItem('sb_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
