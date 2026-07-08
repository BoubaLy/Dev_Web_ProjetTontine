import { createContext, useContext, useEffect, useState } from 'react';
import api, { TOKEN_KEY } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored) {
        try {
          const { data } = await api.get('/me');
          setUser(data.data.user);
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const persist = (value) => { localStorage.setItem(TOKEN_KEY, value); setToken(value); };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data.data; // { user, token, otp_hint }
  };

  const verifyOtp = async (telephone, code) => {
    const { data } = await api.post('/auth/verify-otp', { telephone, code });
    return data.data;
  };

  const login = async (telephone, password) => {
    const { data } = await api.post('/auth/login', { telephone, password });
    persist(data.data.token);
    setUser(data.data.user);
    return data.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* token peut être déjà invalide */ }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await api.get('/me');
    setUser(data.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, verifyOtp, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
