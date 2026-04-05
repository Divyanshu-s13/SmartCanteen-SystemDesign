'use client';

/**
 * Auth Context
 * Manages authentication state across the application
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/api';
import { socketService } from '@/services/socket';
import {
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
} from '@/lib/utils';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check token and load user on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      const storedUser = getStoredUser() as User | null;

      if (token && storedUser) {
        // Verify token is still valid
        const response = await authApi.verifyToken();
        if (response.success && response.data) {
          setUser(response.data);
          setStoredUser(response.data);

          // Connect socket and authenticate
          socketService.connect();
          socketService.authenticate(token);
        } else {
          // Token invalid, clear storage
          removeToken();
          removeStoredUser();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });

    if (response.success && response.data) {
      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      setStoredUser(user);

      // Connect socket and authenticate
      socketService.connect();
      socketService.authenticate(token);

      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }

      return { success: true, message: 'Login successful' };
    }

    return { success: false, message: response.message };
  }, [router]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const response = await authApi.signup({ name, email, password });

    if (response.success && response.data) {
      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      setStoredUser(user);

      // Connect socket and authenticate
      socketService.connect();
      socketService.authenticate(token);

      router.push('/dashboard');
      return { success: true, message: 'Signup successful' };
    }

    return { success: false, message: response.message };
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    removeToken();
    removeStoredUser();
    socketService.disconnect();
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    setStoredUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
