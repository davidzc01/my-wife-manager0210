import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { importData } from '../services/storage';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { login, logout } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = login(password);
    if (!success) {
      setError('密码错误，请重试');
    }
  };

  // 处理注销
  const handleLogout = async () => {
    // 清除所有数据
    localStorage.removeItem('my_wife_manager_data');
    localStorage.removeItem('my_wife_manager_user');
    localStorage.removeItem('my_wife_manager_needs_setup');
    
    // 退出登录
    await logout();
    
    // 关闭确认对话框
    setShowLogoutConfirm(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8">
          <h2 className="text-3xl font-bold text-white text-center">老婆管理器</h2>
          <p className="text-blue-100 text-center mt-2">请输入密码登录</p>
        </div>
        <div className="px-6 py-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                密码
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember" className="ml-2 text-gray-700">
                  记住我
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              登录
            </button>
          </form>

          {/* 数据导入选项 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-bold mb-4 text-gray-700">数据导入</h3>
            <p className="text-gray-600 mb-4">点击下方按钮上传JSON文件导入数据，可用于恢复备份或从其他设备迁移数据。</p>
            <input
              type="file"
              id="importFile"
              accept=".json"
              className="w-full mb-4"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const result = event.target?.result;
                    if (result) {
                      const success = importData(result as string);
                      if (success) {
                        alert('数据导入成功！请重新登录。');
                      } else {
                        alert('数据导入失败，请检查文件格式是否正确。');
                      }
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </div>

          {/* 注销选项 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              注销账户
            </button>
          </div>
        </div>
      </div>

      {/* 注销确认对话框 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-500 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-red-800 p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6 text-red-400">确认注销</h3>
            <p className="text-white mb-8">您确定要删除所有数据并注销账户吗？此操作不可恢复！</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
              >
                取消
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
              >
                确认注销
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;