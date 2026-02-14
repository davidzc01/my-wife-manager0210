import React, { useState, useEffect } from 'react';
import { saveCycleData, loadData } from '../services/storage';
import { useModal } from '../contexts/ModalContext';
import Layout from './Layout';

interface SexRecord {
  id: string;
  date: string;
  location?: string;
  position?: string;
  ejaculation: boolean;
  ejaculationLocation?: string;
  notes?: string;
  feelings?: string;
}

interface CycleData {
  lastPeriodStart: string;
  cycleLength: number;
  periodLength: number;
  sexRecords: SexRecord[];
}

const CycleTracker: React.FC = () => {
  const { setShowSexModal } = useModal();
  const [cycleData, setCycleData] = useState<CycleData>({
    lastPeriodStart: '',
    cycleLength: 28,
    periodLength: 5,
    sexRecords: [],
  });
  const [error] = useState('');
  const [success, setSuccess] = useState('');
  const [cycleStatus, setCycleStatus] = useState({
    currentDay: 0,
    status: '未知',
    statusColor: 'gray',
    nextPeriod: '',
    fertileWindow: [] as string[],
    pregnancyRisk: '低',
  });

  // 加载周期数据
  useEffect(() => {
    const data = loadData();
    if (data && data.cycle) {
      setCycleData(data.cycle);
    }
  }, []);

  // 计算周期状态
  useEffect(() => {
    if (cycleData.lastPeriodStart) {
      const today = new Date();
      const lastPeriod = new Date(cycleData.lastPeriodStart);
      const daysSinceLastPeriod = Math.floor(
        (today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24)
      );

      const currentDay = daysSinceLastPeriod % cycleData.cycleLength;
      let status = '未知';
      let statusColor = 'gray';

      // 计算状态
      if (currentDay < cycleData.periodLength) {
        status = '经期';
        statusColor = 'red';
      } else if (currentDay >= 10 && currentDay <= 17) {
        status = '排卵期';
        statusColor = 'yellow';
      } else if (currentDay >= 18 && currentDay <= 24) {
        status = '黄体期';
        statusColor = 'blue';
      } else {
        status = '安全期';
        statusColor = 'green';
      }

      // 计算下次经期
      const nextPeriod = new Date(lastPeriod);
      nextPeriod.setDate(lastPeriod.getDate() + cycleData.cycleLength);

      // 计算 fertile window
      const fertileWindowStart = new Date(lastPeriod);
      fertileWindowStart.setDate(lastPeriod.getDate() + 10);
      const fertileWindowEnd = new Date(lastPeriod);
      fertileWindowEnd.setDate(lastPeriod.getDate() + 17);

      // 计算怀孕风险
      let pregnancyRisk = '低';
      if (currentDay >= 10 && currentDay <= 17) {
        pregnancyRisk = '高';
      } else if (currentDay >= 8 && currentDay <= 9) {
        pregnancyRisk = '中';
      } else if (currentDay >= 18 && currentDay <= 20) {
        pregnancyRisk = '中';
      }

      // 检查怀孕预警
      if (daysSinceLastPeriod > cycleData.cycleLength + 7) {
        status = '可能怀孕';
        statusColor = 'purple';
        pregnancyRisk = '高';
      }

      setCycleStatus({
        currentDay,
        status,
        statusColor,
        nextPeriod: nextPeriod.toLocaleDateString(),
        fertileWindow: [fertileWindowStart.toLocaleDateString(), fertileWindowEnd.toLocaleDateString()] as string[],
        pregnancyRisk,
      });
    }
  }, [cycleData]);



  // 删除做爱记录
  const deleteSexRecord = (id: string) => {
    const updatedRecords = cycleData.sexRecords.filter(record => record.id !== id);
    setCycleData(prev => ({
      ...prev,
      sexRecords: updatedRecords,
    }));
    saveCycleData({ ...cycleData, sexRecords: updatedRecords });
    setSuccess('做爱记录已删除！');
  };
  
  // 编辑做爱记录状态
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<{
    id: string;
    location: string;
    position: string;
    ejaculation: boolean;
    ejaculationLocation: string;
    feelings: string;
  }>({ 
    id: '', 
    location: '', 
    position: '', 
    ejaculation: false, 
    ejaculationLocation: '',
    feelings: '' 
  });
  
  // 开始编辑做爱记录
  const startEditSexRecord = (record: SexRecord) => {
    setEditingRecord({
      id: record.id,
      location: record.location || '',
      position: record.position || '',
      ejaculation: record.ejaculation,
      ejaculationLocation: record.ejaculationLocation || '',
      feelings: record.feelings || ''
    });
    setIsEditing(true);
  };
  
  // 保存编辑的做爱记录
  const saveEditedSexRecord = () => {
    const updatedRecords = cycleData.sexRecords.map(record => {
      if (record.id === editingRecord.id) {
        return {
          ...record,
          location: editingRecord.location,
          position: editingRecord.position,
          ejaculation: editingRecord.ejaculation,
          ejaculationLocation: editingRecord.ejaculation ? editingRecord.ejaculationLocation : undefined,
          feelings: editingRecord.feelings || undefined
        };
      }
      return record;
    });
    
    setCycleData(prev => ({
      ...prev,
      sexRecords: updatedRecords,
    }));
    saveCycleData({ ...cycleData, sexRecords: updatedRecords });
    setSuccess('做爱记录已更新！');
    setIsEditing(false);
  };

  // 计算距上次做爱时间
  const getDaysSinceLastSex = () => {
    if (cycleData.sexRecords.length === 0) {
      return '从未';
    }

    const sortedRecords = [...cycleData.sexRecords].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const lastSexDate = new Date(sortedRecords[0].date);
    const today = new Date();
    const daysSince = Math.floor(
      (today.getTime() - lastSexDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince === 0) {
      return '今天';
    } else if (daysSince === 1) {
      return '昨天';
    } else {
      return `${daysSince}天前`;
    }
  };

  return (
    <Layout>
      <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-8">
        <h2 className="text-3xl font-bold mb-8 text-center text-blue-400">生理周期跟踪</h2>

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

        {/* 当前状态卡片 */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-purple-300">当前状态</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold">周期状态</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  cycleStatus.statusColor === 'red' ? 'bg-red-600' :
                  cycleStatus.statusColor === 'green' ? 'bg-green-600' :
                  cycleStatus.statusColor === 'yellow' ? 'bg-yellow-600' :
                  cycleStatus.statusColor === 'blue' ? 'bg-blue-600' :
                  'bg-purple-600'
                }`}>
                  {cycleStatus.status}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">当前周期天数:</span>
                  <span className="font-bold">{cycleStatus.currentDay + 1}/{cycleData.cycleLength}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">下次经期:</span>
                  <span className="font-bold">{cycleStatus.nextPeriod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">排卵期:</span>
                  <span className="font-bold">{cycleStatus.fertileWindow[0]} 至 {cycleStatus.fertileWindow[1]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">怀孕风险:</span>
                  <span className={`font-bold ${
                    cycleStatus.pregnancyRisk === '高' ? 'text-red-400' :
                    cycleStatus.pregnancyRisk === '中' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {cycleStatus.pregnancyRisk}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-bold mb-4">做爱记录</h4>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">距上次做爱:</span>
                  <span className="font-bold">{getDaysSinceLastSex()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">做爱记录总数:</span>
                  <span className="font-bold">{cycleData.sexRecords.length}</span>
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h5 className="text-sm font-bold mb-2 text-gray-300">最近一次做爱</h5>
                {cycleData.sexRecords.length === 0 ? (
                  <p className="text-gray-400">暂无记录</p>
                ) : (
                  <div>
                    {[...cycleData.sexRecords]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 1)
                      .map((record) => (
                        <div key={record.id} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">日期:</span>
                            <span>{record.date}</span>
                          </div>
                          {record.location && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">地点:</span>
                              <span>{record.location}</span>
                            </div>
                          )}
                          {record.position && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">姿势:</span>
                              <span>{record.position}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-400">射精:</span>
                            <span>{record.ejaculation ? '是' : '否'}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-purple-300">快捷操作</h3>
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <button
                onClick={() => setShowSexModal(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] transform hover:scale-105 flex-1 flex items-center justify-center space-x-3"
              >
                <span className="text-2xl">🌸</span>
                <span>记录生理状态</span>
              </button>
            </div>
            <p className="text-gray-400 mt-4 text-center">
              点击按钮记录生理状态和做爱记录
            </p>
          </div>
        </div>

        {/* 做爱记录列表 */}
        <div>
          <h3 className="text-xl font-bold mb-6 text-purple-300">做爱记录列表</h3>
          <div className="bg-gray-700 rounded-lg p-6">
            {cycleData.sexRecords.length === 0 ? (
              <p className="text-gray-400 text-center py-8">暂无做爱记录</p>
            ) : (
              <div className="space-y-4">
                {[...cycleData.sexRecords]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => (
                    <div key={record.id} className="bg-gray-800 rounded-lg p-4 flex flex-col md:flex-row md:justify-between md:items-center">
                      <div className="md:w-2/3 space-y-2">
                        <div className="flex items-center space-x-4">
                          <span className="text-blue-300 font-bold">{record.date}</span>
                          {record.location && (
                            <span className="text-gray-300">{record.location}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {record.position && (
                            <span className="text-gray-400">姿势: {record.position}</span>
                          )}
                          <span className="text-gray-400">射精: {record.ejaculation ? '是' : '否'}</span>
                          {record.ejaculationLocation && (
                            <span className="text-gray-400">射精位置: {record.ejaculationLocation}</span>
                          )}
                        </div>
                        {record.feelings && (
                          <p className="text-gray-400 text-sm mt-1">感受: {record.feelings}</p>
                        )}
                        {record.notes && (
                          <p className="text-gray-400 text-sm mt-1">{record.notes}</p>
                        )}
                      </div>
                      <div className="md:w-1/3 flex justify-end gap-3 mt-4 md:mt-0">
                        <button
                          onClick={() => startEditSexRecord(record)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300 ease-in-out"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => deleteSexRecord(record.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-300 ease-in-out"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 编辑做爱记录模态框 */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-500 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-purple-800 p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">编辑做爱记录</h3>
            
            <div className="space-y-6">
              {/* 地点 */}
              <div>
                <h4 className="text-sm text-gray-400 mb-2">地点</h4>
                <input
                  type="text"
                  placeholder="例如：卧室、客厅、酒店等"
                  value={editingRecord.location}
                  onChange={(e) => setEditingRecord(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              {/* 姿势 */}
              <div>
                <h4 className="text-sm text-gray-400 mb-2">姿势</h4>
                <input
                  type="text"
                  placeholder="例如：传教士、女上位、后入等"
                  value={editingRecord.position}
                  onChange={(e) => setEditingRecord(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              {/* 是否射精 */}
              <div>
                <h4 className="text-sm text-gray-400 mb-2">是否射精</h4>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingRecord.ejaculation}
                    onChange={(e) => setEditingRecord(prev => ({ ...prev, ejaculation: e.target.checked }))}
                    className="w-5 h-5 text-pink-500 border-gray-600 rounded focus:ring-pink-500"
                  />
                  <span className="ml-3 text-white">是</span>
                </div>
              </div>
              
              {/* 射精部位 */}
              {editingRecord.ejaculation && (
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">射精部位</h4>
                  <input
                    type="text"
                    placeholder="例如：体内、体外、口中、乳中等"
                    value={editingRecord.ejaculationLocation}
                    onChange={(e) => setEditingRecord(prev => ({ ...prev, ejaculationLocation: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              )}
              
              {/* 感受 */}
              <div>
                <h4 className="text-sm text-gray-400 mb-2">感受</h4>
                <textarea
                  placeholder="例如：很愉快、很满足、很刺激等"
                  value={editingRecord.feelings}
                  onChange={(e) => setEditingRecord(prev => ({ ...prev, feelings: e.target.value }))}
                  className="w-full h-24 px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            
            {/* 按钮 */}
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
              >
                取消
              </button>
              <button 
                onClick={saveEditedSexRecord}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CycleTracker;