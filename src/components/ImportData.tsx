import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { importData } from '../services/storage';

const ImportData: React.FC = () => {
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (result) {
          const success = importData(result as string);
          if (success) {
            setImportStatus('success');
            setErrorMessage('');
          } else {
            setImportStatus('error');
            setErrorMessage('数据导入失败，请检查文件格式是否正确。');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-teal-700 px-6 py-8">
          <h2 className="text-3xl font-bold text-white text-center">导入数据</h2>
          <p className="text-green-100 text-center mt-2">上传之前导出的JSON文件</p>
        </div>
        <div className="px-6 py-8">
          {/* 导入状态提示 */}
          {importStatus === 'success' && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              数据导入成功！请重新登录应用。
            </div>
          )}
          {importStatus === 'error' && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {errorMessage}
            </div>
          )}

          {/* 文件上传区域 */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">选择JSON文件</h3>
            <input
              type="file"
              id="importFile"
              accept=".json"
              className="w-full mb-4"
              onChange={handleFileUpload}
            />
            <p className="text-sm text-gray-500 mb-6">
              请选择之前通过本应用导出的JSON文件，文件格式应为：
              <br />
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">wife-manager-data-YYYY-MM-DD.json</code>
            </p>
          </div>

          {/* 导入说明 */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-gray-700">导入说明</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>导入数据会覆盖所有现有数据</li>
              <li>导入成功后请重新登录应用</li>
              <li>如果导入失败，请检查文件格式是否正确</li>
              <li>确保文件是通过本应用导出的JSON格式</li>
            </ul>
          </div>

          {/* 返回按钮 */}
          <div className="space-y-4">
            <Link to="/register">
              <button
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                返回选择页面
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportData;