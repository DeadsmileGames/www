import { createContext, useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  const refresh = useCallback(async () => {
    try {
      const me = await api.get('/auth/me');

      setUser(me);
      setStatus('authenticated');

      return me;
    } catch {
      setUser(null);
      setStatus('guest');

      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const invalidate = () => {
      setUser(null);
      setStatus('guest');
    };
    window.addEventListener('deadsmile:auth-invalidated', invalidate);
    return () => window.removeEventListener('deadsmile:auth-invalidated', invalidate);
  }, []);

  const login = useCallback(
    async (email, password, recaptchaToken) => {
      const result = await api.post('/auth/login', {
        email,
        password,
        recaptchaToken,
      });
      if (result?.requiresTwoFactor) {
        setUser(null);
        setStatus('twoFactor');

        return result;
      }
      setUser(result);
      setStatus('authenticated');

      return result;
    },
    []
  );

  const verifyTwoFactor = useCallback(async (token) => {
    const me = await api.post('/auth/verify-2fa', {
      token,
    });

    setUser(me);
    setStatus('authenticated');

    return me;
  }, []);

  const register = useCallback(async (payload) => {
    const me = await api.post('/auth/register', payload);

    setUser(me);
    setStatus('authenticated');

    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (status === 'authenticated') {
        await api.post('/auth/logout');
      }
    } finally {
      setUser(null);
      setStatus('guest');
    }
  }, [status]);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        verifyTwoFactor,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}