import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import Login from './components/Login';
import Register from './components/Register';
import CreateProfile from './components/CreateProfile';
import ImportData from './components/ImportData';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import WifeProfile from './components/WifeProfile';
import Gallery from './components/Gallery';
import CycleTracker from './components/CycleTracker';
import ExpenseTracker from './components/ExpenseTracker';
import ObservationLog from './components/ObservationLog';
import './App.css';

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 认证路由组件
const AuthRoute: React.FC<{ children: React.ReactNode; isRegister?: boolean }> = ({ children, isRegister = false }) => {
  const { isAuthenticated, needsSetup, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 当需要设置且不是注册页面时，重定向到注册页面
  if (needsSetup && !isRegister) {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
};

// 根路由组件，处理首次访问重定向
const RootRoute: React.FC = () => {
  const { isAuthenticated, needsSetup, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (needsSetup) {
      return <Navigate to="/register" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return <Dashboard />;
};

// 路由配置
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 认证路由 */}
      <Route 
        path="/login" 
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <AuthRoute isRegister={true}>
            <Register />
          </AuthRoute>
        } 
      />
      <Route 
        path="/create-profile" 
        element={
          <AuthRoute isRegister={true}>
            <CreateProfile />
          </AuthRoute>
        } 
      />
      <Route 
        path="/import-data" 
        element={
          <AuthRoute isRegister={true}>
            <ImportData />
          </AuthRoute>
        } 
      />
      
      {/* 根路由 */}
      <Route 
        path="/" 
        element={<RootRoute />} 
      />
      
      {/* 受保护的路由 */}
      <Route 
        path="/user" 
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/wife" 
        element={
          <ProtectedRoute>
            <WifeProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/gallery" 
        element={
          <ProtectedRoute>
            <Gallery />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cycle" 
        element={
          <ProtectedRoute>
            <CycleTracker />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/expense" 
        element={
          <ProtectedRoute>
            <ExpenseTracker />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/observation" 
        element={
          <ProtectedRoute>
            <ObservationLog />
          </ProtectedRoute>
        } 
      />
      
      {/* 捕获所有未匹配的路由，重定向到首页 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App
