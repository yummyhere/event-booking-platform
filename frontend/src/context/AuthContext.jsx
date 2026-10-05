import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('event_token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('event_user') || 'null');
    } catch {
      return null;
    }
  });

  const clearSession = () => {
    localStorage.removeItem('event_token');
    localStorage.removeItem('event_user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      if (window.location.pathname !== '/login') window.location.assign('/login');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const saveSession = ({ user: nextUser, token: nextToken }) => {
    localStorage.setItem('event_token', nextToken);
    localStorage.setItem('event_user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  };

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return saveSession(data.data);
  };

  const register = async (details) => {
    const { data } = await api.post('/auth/register', details);
    return saveSession(data.data);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout: clearSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}