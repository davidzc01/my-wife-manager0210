import CryptoJS from 'crypto-js';

// 存储键名
const STORAGE_KEY = 'my_wife_manager_data';

// 固定加密密钥（32字符，确保安全性）
const KEY = 'MyWifeManagerSecureKey20260214!@#$%^&*';


// 加密数据
export const encryptData = (data: any): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), KEY).toString();
};

// 解密数据
export const decryptData = (encryptedData: string): any => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// 保存数据
export const saveData = (data: any): void => {
  const encryptedData = encryptData(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: encryptedData }));
};

// 加载数据
export const loadData = (): any => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    try {
      const fileData = JSON.parse(storedData);
      return decryptData(fileData.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      return null;
    }
  }
  return null;
};

// 检查是否存在用户数据
export const hasUserData = (): boolean => {
  const data = loadData();
  return data !== null && data.user !== undefined;
};

// 保存用户数据
export const saveUserData = (userData: any): void => {
  const currentData = loadData() || {};
  currentData.user = userData;
  saveData(currentData);
};

// 保存老婆数据
export const saveWifeData = (wifeData: any): void => {
  const currentData = loadData() || {};
  currentData.wife = wifeData;
  saveData(currentData);
};

// 保存图片数据
export const saveImages = (images: any[]): void => {
  const currentData = loadData() || {};
  currentData.images = images;
  saveData(currentData);
};

// 保存生理周期数据
export const saveCycleData = (cycleData: any): void => {
  const currentData = loadData() || {};
  currentData.cycle = cycleData;
  saveData(currentData);
};

// 保存消费记录数据
export const saveExpenseData = (expenseData: any): void => {
  const currentData = loadData() || {};
  currentData.expenses = expenseData;
  saveData(currentData);
};

// 保存观察日志数据
export const saveObservation = (observations: any[]): void => {
  const currentData = loadData() || {};
  currentData.observations = observations;
  saveData(currentData);
};

// 导出所有数据
export const exportData = (): string => {
  const data = loadData();
  if (data) {
    return JSON.stringify(data, null, 2);
  }
  return JSON.stringify({}, null, 2);
};

// 导入数据
export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    saveData(data);
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
};