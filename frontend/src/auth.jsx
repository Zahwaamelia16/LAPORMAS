import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);
function normalizeUser(user) {
  if (!user) return user;
  return { ...user, role: user.role === 'petugas' ? 'pengelola' : user.role };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('lapormas_token'));

  useEffect(() => {
    let active = true;
    if (!token) { setLoading(false); return () => { active = false; }; }
    api('/auth/me').then((data) => { if (active) setUser(normalizeUser(data.user)); })
      .catch(() => { localStorage.removeItem('lapormas_token'); if (active) { setToken(null); setUser(null); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const login = async (credentials) => {
    const apiRole = credentials.role === 'pengelola' ? 'petugas' : credentials.role;
    const data = await api('/auth/login', { method: 'POST', body: { ...credentials, role: apiRole } });
    localStorage.setItem('lapormas_token', data.token);
    setToken(data.token);
    let user = normalizeUser(data.user);
    try { const profile = await api('/auth/me'); user = normalizeUser(profile.user); }
    catch { setUser(user); }
    setUser(user);
    return { ...data, user };
  };
  const logout = () => { localStorage.removeItem('lapormas_token'); setToken(null); setUser(null); };
  const value = useMemo(() => ({ user, loading, login, logout, setUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
