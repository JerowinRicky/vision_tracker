import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refresh: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isOperator: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/auth/me/')
        .then((resp) => {
          setUser(resp.data);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        })
        .finally(() => {
          clearTimeout(timer);
          setLoading(false);
        });
    } else {
      clearTimeout(timer);
      setLoading(false);
    }

    return () => clearTimeout(timer);
  }, []);

  const login = (token: string, refresh: string, userData: User) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refresh);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    window.location.href = '/login';
  };

  const isAdmin = user?.role === 'admin';
  const isOperator = user?.role === 'admin' || user?.role === 'operator';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isOperator }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
