import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const storeAuth = useCallback((data) => {
    setUser(data.user);
    localStorage.setItem('splitsync_token', data.token);
    localStorage.setItem('splitsync_user', JSON.stringify(data.user));
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    localStorage.removeItem('splitsync_token');
    localStorage.removeItem('splitsync_user');
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      storeAuth(data.data);
      return data.data;
    },
    [storeAuth]
  );

  const register = useCallback(
    async (name, email, password) => {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
      });
      storeAuth(data.data);
      return data.data;
    },
    [storeAuth]
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  useEffect(() => {
    const token = localStorage.getItem('splitsync_token');
    const storedUser = localStorage.getItem('splitsync_user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      api
        .get('/auth/me')
        .then(({ data }) => {
          setUser(data.data.user);
          localStorage.setItem(
            'splitsync_user',
            JSON.stringify(data.data.user)
          );
        })
        .catch(() => {
          clearAuth();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
