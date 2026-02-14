import CryptoJS from 'crypto-js';
import { saveUserData, loadData, hasUserData } from './storage';

// 哈希密码
export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

// 验证密码
export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return hashPassword(password) === hashedPassword;
};

// 注册用户
export const registerUser = (userData: {
  username: string;
  nickname: string;
  birthday: string;
  password: string;
  avatar?: string;
}): void => {
  const hashedPassword = hashPassword(userData.password);
  const newUserData = {
    ...userData,
    password: hashedPassword,
  };
  saveUserData(newUserData);
};

// 登录用户
export const loginUser = (password: string): boolean => {
  const data = loadData();
  if (!data || !data.user) {
    return false;
  }
  return verifyPassword(password, data.user.password);
};

// 获取用户数据
export const getUserData = () => {
  const data = loadData();
  return data?.user || null;
};

// 检查是否需要初始化用户
export const needsInitialization = (): boolean => {
  return !hasUserData();
};