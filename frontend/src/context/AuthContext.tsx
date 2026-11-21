import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types/auth';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): { sub?: string; exp?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('devflow_token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('devflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('devflow_token');
    localStorage.removeItem('devflow_user');
    setToken(null);
    setUser(null);
  }, []);

  // Verify token on mount and handle automatic logout on expiration
  useEffect(() => {
    const storedToken = localStorage.getItem('devflow_token');
    if (storedToken) {
      const payload = parseJwt(storedToken);
      if (payload?.exp && Date.now() >= payload.exp * 1000) {
        // Token has expired
        logout();
      } else {
        setToken(storedToken);
        const storedUser = localStorage.getItem('devflow_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            setUser(null);
          }
        } else if (payload?.sub) {
          // Fallback minimal user object from JWT sub
          setUser({
            id: payload.sub,
            name: 'DevFlow User',
            email: 'user@devflow.cloud',
            created_at: new Date().toISOString(),
          });
        }
      }
    } else {
      logout();
    }
    setIsLoading(false);
  }, [logout]);

  // Listen for global 401 unauthorized events from Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('devflow:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('devflow:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = async (credentials: LoginRequest): Promise<void> => {
    const response = await authApi.login(credentials);
    const accessToken = response.access_token;
    localStorage.setItem('devflow_token', accessToken);
    setToken(accessToken);

    const payload = parseJwt(accessToken);
    const resolvedUser: User = {
      id: payload?.sub || 'user',
      name: credentials.email.split('@')[0],
      email: credentials.email,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('devflow_user', JSON.stringify(resolvedUser));
    setUser(resolvedUser);
  };

  const register = async (data: RegisterRequest): Promise<User> => {
    const newUser = await authApi.register(data);
    // Cache the registered user profile
    localStorage.setItem('devflow_user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
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
