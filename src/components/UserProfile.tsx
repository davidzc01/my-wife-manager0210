import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveUserData, loadData, exportData } from '../services/storage';
import { hashPassword } from '../services/auth';
import Layout from './Layout';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    nickname: user?.nickname || '',
    birthday: user?.birthday || '',
  });
  const [avatar, setAvatar] = useState<string>(() => {
    // 先从sessionStorage中获取临时头像
    const tempAvatar = sessionStorage.getItem('tempAvatar');
    if (tempAvatar) {
      return tempAvatar;
    }
    return user?.avatar || '';
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件大小（2MB限制）
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setError('头像文件大小不能超过2MB');
        return;
      }

      // 使用Canvas压缩图片
      const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();

          img.onload = () => {
            // 计算压缩后的尺寸
            const maxWidth = 800;
            const maxHeight = 800;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;

            // 绘制压缩后的图片
            ctx?.drawImage(img, 0, 0, width, height);

            // 转换为base64，设置压缩质量
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(compressedDataUrl);
          };

          img.onerror = () => {
            reject(new Error('图片加载失败'));
          };

          img.src = URL.createObjectURL(file);
        });
      };

      compressImage(file)
        .then((compressedAvatar) => {
          setAvatar(compressedAvatar);
          // 存储到sessionStorage防止刷新丢失
          sessionStorage.setItem('tempAvatar', compressedAvatar);
          setSuccess('头像上传成功！');
        })
        .catch((error) => {
          setError(`头像处理失败: ${error.message}`);
        });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // 保存用户信息
      const updatedUser = {
        ...user,
        username: formData.username,
        nickname: formData.nickname,
        birthday: formData.birthday,
        avatar,
      };

      saveUserData(updatedUser);
      // 清除临时头像存储
      sessionStorage.removeItem('tempAvatar');
      setSuccess('个人信息更新成功！');
    } catch (error) {
      setError('保存用户信息失败，请重试');
      console.error('保存用户信息失败:', error);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 验证密码
    const data = loadData();
    if (!data || !data.user) {
      setError('无法加载用户数据');
      return;
    }

    // 验证当前密码
    if (hashPassword(passwordForm.currentPassword) !== data.user.password) {
      setError('当前密码错误');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    // 更新密码
    const updatedUser = {
      ...user,
      password: hashPassword(passwordForm.newPassword),
    };

    saveUserData(updatedUser);
    setSuccess('密码更新成功！');
    // 清空密码表单
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  // 处理注销
  const handleLogout = async () => {
    // 清除所有数据
    localStorage.removeItem('my_wife_manager_data');
    localStorage.removeItem('my_wife_manager_user');
    localStorage.removeItem('my_wife_manager_needs_setup');
    
    // 退出登录
    await logout();
  };

  return (
    <Layout>
      <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-8">
        <h2 className="text-3xl font-bold mb-8 text-center text-blue-400">用户档案</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* 个人信息表单 */}
        <form onSubmit={handleSubmit} className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-purple-300">个人信息</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 头像上传 */}
            <div className="md:col-span-1">
              <label htmlFor="avatar" className="block text-gray-300 text-sm font-bold mb-2">
                头像
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition duration-300 ease-in-out">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="w-32 h-32 rounded-full object-cover" />
                    ) : (
                      <>
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-400 mt-2">点击上传头像</p>
                      </>
                    )}
                  </div>
                  <input id="avatar" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>

            {/* 个人信息 */}
            <div className="md:col-span-1 space-y-4">
              <div>
                <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="nickname" className="block text-gray-300 text-sm font-bold mb-2">
                  期望称呼
                </label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.nickname}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="birthday" className="block text-gray-300 text-sm font-bold mb-2">
                  生日
                </label>
                <input
                  type="date"
                  id="birthday"
                  name="birthday"
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.birthday}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              更新个人信息
            </button>
          </div>
        </form>

        {/* 密码修改表单 */}
        <form onSubmit={handlePasswordSubmit}>
          <h3 className="text-xl font-bold mb-6 text-purple-300">修改密码</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-gray-300 text-sm font-bold mb-2">
                当前密码
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-gray-300 text-sm font-bold mb-2">
                新密码
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-bold mb-2">
                确认新密码
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              更新密码
            </button>
          </div>
        </form>

        {/* 数据导出选项 */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <h3 className="text-xl font-bold mb-6 text-blue-300">数据导出</h3>
          <p className="text-blue-400 mb-6">点击下方按钮导出所有数据到JSON文件，可用于备份或迁移到其他设备。</p>
          <div className="flex justify-end">
            <button
              onClick={() => {
                try {
                  const data = exportData();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `wife-manager-data-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  setSuccess('数据导出成功！');
                } catch (error) {
                  setError('数据导出失败，请重试');
                  console.error('数据导出失败:', error);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              导出数据
            </button>
          </div>
        </div>

        {/* 注销选项 */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <h3 className="text-xl font-bold mb-6 text-red-300">注销账户</h3>
          <p className="text-red-400 mb-6">点击下方按钮将删除所有数据并注销账户，此操作不可恢复！</p>
          <div className="flex justify-end">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
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
    </Layout>
  );
};

export default UserProfile;