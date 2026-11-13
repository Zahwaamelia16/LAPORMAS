import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('lapormas_token'));

  useEffect(() => {
    let active = true;
    if (!token) { setLoading(false); return () => { active = false; }; }
    api('/auth/me').then((data) => { if (active) setUser(data.user); })
      .catch(() => { localStorage.removeItem('lapormas_token'); if (active) { setToken(null); setUser(null); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const login = async (credentials) => {
    const data = await api('/auth/login', { method: 'POST', body: credentials });
    localStorage.setItem('lapormas_token', data.token);
    setToken(data.token);
    try { const profile = await api('/auth/me'); setUser(profile.user); }
    catch { setUser(data.user); }
    return data;
  };
  const logout = () => { localStorage.removeItem('lapormas_token'); setToken(null); setUser(null); };
  const value = useMemo(() => ({ user, loading, login, logout, setUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
