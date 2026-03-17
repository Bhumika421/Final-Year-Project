import { useEffect, useState } from 'react';
import { api, getToken, setAuthToken, clearToken } from '../api/client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const token = getToken();
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      setAuthToken(token);
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
    } catch (e) {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  return { user, loading, refresh, logout: () => { clearToken(); setUser(null); } };
}
