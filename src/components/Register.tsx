import React from 'react';
import { Link } from 'react-router-dom';

const Register: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8">
          <h2 className="text-3xl font-bold text-white text-center">老婆管理器</h2>
          <p className="text-blue-100 text-center mt-2">首次使用，请选择以下选项：</p>
        </div>
        <div className="px-6 py-8">
          <div className="space-y-6">
            {/* 创建档案选项 */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4 text-gray-700">创建新档案</h3>
              <p className="text-gray-600 mb-6">从头开始创建您的个人和老婆档案</p>
              <Link to="/create-profile">
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  创建档案
                </button>
              </Link>
            </div>

            {/* 分割线 */}
            <div className="flex items-center">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="mx-4 text-gray-500">或</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* 导入数据选项 */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4 text-gray-700">导入数据</h3>
              <p className="text-gray-600 mb-6">导入之前导出的数据，快速恢复您的档案</p>
              <Link to="/import-data">
                <button
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  导入数据
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;