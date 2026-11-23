import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  quickStartDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('nexus_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      const response = await api.get<User>('/auth/me');
      setUser(response.data);
    } catch (err) {
      console.error('Failed to load authenticated user profile', err);
      localStorage.removeItem('nexus_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('nexus_token', response.data.access_token);
    await fetchCurrentUser();
  };

  const register = async (data: any) => {
    const response = await api.post('/auth/register', data);
    localStorage.setItem('nexus_token', response.data.access_token);
    await fetchCurrentUser();
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    setUser(null);
    window.location.href = '/login';
  };

  const quickStartDemo = async () => {
    setIsLoading(true);
    try {
      const resp = await api.post('/demo/quick-start');
      const creds = resp.data.default_credentials;
      await login(creds.email, creds.password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        quickStartDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
