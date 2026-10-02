import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  adminLogin: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  quickSwitchAccount: (type: 'reseller' | 'admin') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const res = await api.getMe();
    if (res.success && res.data) {
      setUser(res.data.user);
    } else {
      clearStoredToken();
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    const res = await api.login({ identifier, password });
    setIsLoading(false);

    if (res.success && res.data?.token) {
      setStoredToken(res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    }
    return {
      success: false,
      message: res.message || 'Login failed',
      status: res.status
    };
  };

  const adminLogin = async (identifier: string, password: string) => {
    setIsLoading(true);
    const res = await api.adminLogin({ identifier, password });
    setIsLoading(false);

    if (res.success && res.data?.token) {
      setStoredToken(res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    }
    return {
      success: false,
      message: res.message || 'Admin login failed',
      status: res.status
    };
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    const res = await api.register(userData);
    setIsLoading(false);

    // If active session token was returned (e.g. if auto-approved in future)
    if (res.success && res.data?.token) {
      setStoredToken(res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true, status: 'ACTIVE' };
    }

    // Normal Registration Flow: PENDING_APPROVAL without active session
    if (res.success) {
      return {
        success: true,
        message: res.message || 'Your registration has been submitted. Your account will become active after admin approval.',
        status: res.status || 'PENDING_APPROVAL'
      };
    }

    return { success: false, message: res.message || 'Registration failed' };
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  // One-click demo switch helper for testing both portals seamlessly
  const quickSwitchAccount = async (type: 'reseller' | 'admin') => {
    if (type === 'admin') {
      await login('admin@rozgar.pk', 'Password123!');
    } else {
      await login('ayeshacollections', 'Password123!');
    }
  };

  const isAdmin = user ? ['SUPER_ADMIN', 'ADMIN'].includes(user.role) : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        adminLogin,
        register,
        logout,
        quickSwitchAccount,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
