import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { apiClient } from '@/utils/api';
import { User, LoginRequest, LoginResponse, APIResponse } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Verify token by making a request to a protected endpoint
      // For now, we'll decode the JWT client-side (in production, verify server-side)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      if (payload.exp * 1000 < Date.now()) {
        // Token expired
        Cookies.remove('token');
        setIsLoading(false);
        return;
      }

      // Create user object from token payload
      setUser({
        id: payload.userId,
        email: payload.email,
        firstName: payload.firstName || 'User',
        lastName: payload.lastName || '',
        name: `${payload.firstName || 'User'} ${payload.lastName || ''}`.trim(),
        role: payload.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      Cookies.remove('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response: APIResponse<LoginResponse> = await apiClient.post('/auth/login', credentials);
      
      if (response.success && response.data && response.data.data) {
        const { token, user: userData } = response.data.data;
        
        // Store token in cookies
        Cookies.set('token', token, { expires: 1 }); // 1 day
        
        setUser(userData);
        toast.success('Login successful');
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || error.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth(requiredRoles?: string[]) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        router.push('/login');
        return;
      }

      if (requiredRoles && !auth.hasRole(requiredRoles)) {
        toast.error('You do not have permission to access this page');
        router.push('/dashboard');
        return;
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user, router, requiredRoles]);

  return auth;
}