import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { needsInitialization, loginUser, registerUser, getUserData } from '../services/auth';

interface User {
  username: string;
  nickname: string;
  birthday: string;
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isInitializing: boolean;
  needsSetup: boolean;
  user: User | null;
  login: (password: string) => boolean;
  register: (userData: {
    username: string;
    nickname: string;
    birthday: string;
    password: string;
    avatar?: string;
  }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    console.log('AuthProvider: Initializing...');
    try {
      // 初始化认证状态
      const setupNeeded = needsInitialization();
      console.log('AuthProvider: setupNeeded:', setupNeeded);
      setNeedsSetup(setupNeeded);
      
      if (!setupNeeded) {
        // 尝试自动登录（这里可以实现记住密码功能）
        // 暂时设置为未认证，需要用户输入密码
        setIsAuthenticated(false);
        const userData = getUserData();
        console.log('AuthProvider: userData:', userData);
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('AuthProvider: Error during initialization:', error);
    } finally {
      console.log('AuthProvider: Initialization complete');
      setIsInitializing(false);
    }
  }, []);

  const login = (password: string): boolean => {
    const success = loginUser(password);
    if (success) {
      setIsAuthenticated(true);
      const userData = getUserData();
      if (userData) {
        setUser(userData);
      }
    }
    return success;
  };

  const register = (userData: {
    username: string;
    nickname: string;
    birthday: string;
    password: string;
    avatar?: string;
  }) => {
    registerUser(userData);
    setNeedsSetup(false);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    // 检查是否需要重新初始化
    const setupNeeded = needsInitialization();
    setNeedsSetup(setupNeeded);
  };

  const value: AuthContextType = {
    isAuthenticated,
    isInitializing,
    needsSetup,
    user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};