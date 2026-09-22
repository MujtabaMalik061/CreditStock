import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { AuthContext } from './context.js';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const restore = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setUser((await api.me()).user); }
    catch (err) {
      setUser(null);
      if (err.status !== 401) setError('We couldn’t connect to your account. Please try again.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    restore();
    const expired = () => { setUser(null); setError(''); };
    window.addEventListener('auth:expired', expired);
    return () => window.removeEventListener('auth:expired', expired);
  }, [restore]);
  async function authenticate(mode, values) {
    const result = await (mode === 'signup' ? api.signUp(values) : api.signIn(values));
    setError('');
    setUser(result.user);
    return result.user;
  }
  async function signOut() {
    await api.signOut();
    setUser(null);
    setError('');
  }
  return <AuthContext.Provider value={{ user, loading, error, restore, authenticate, signOut }}>{children}</AuthContext.Provider>;
}
