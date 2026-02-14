import React, { useState, useEffect } from 'react';
import { loadData, saveObservation } from '../services/storage';
import { useModal } from '../contexts/ModalContext';
import Layout from './Layout';

interface Observation {
  id: string;
  date: string;
  mood: string;
  content: string;
  images?: string[];
}

const ObservationLog: React.FC = () => {
  const [observations, setObservations] = useState<Observation[]>([]);
  const { setShowAddObservationModal, observationUpdated, setObservationUpdated } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedObservations, setExpandedObservations] = useState<Set<string>>(new Set());
  const [statsPeriod, setStatsPeriod] = useState<'year' | 'quarter' | 'month' | 'week'>('month');
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<{
    mood: string;
    content: string;
    date: string;
  }>({ mood: '', content: '', date: '' });

  // 加载数据
  useEffect(() => {
    const data = loadData();
    if (data && data.observations) {
      setObservations(data.observations);
    }
    // 重置observationUpdated为false，以便下次添加记录时再次触发重新加载
    if (observationUpdated) {
      setObservationUpdated(false);
    }
  }, [observationUpdated, setObservationUpdated]);



  // 切换观察日志展开/折叠
  const toggleObservation = (id: string) => {
    const newExpanded = new Set(expandedObservations);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedObservations(newExpanded);
  };

  // 过滤观察日志
  const filteredObservations = observations.filter(obs => {
    const matchesSearch = obs.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         obs.mood.includes(searchTerm);
    const matchesDate = !dateFilter || obs.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  // 计算统计数据
  const calculateStats = () => {
    const now = new Date();
    let startDate = new Date();

    switch (statsPeriod) {
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
    }

    const periodObservations = observations.filter(obs => 
      new Date(obs.date) >= startDate
    );

    // 统计心情分布
    const moodStats: Record<string, number> = {};
    periodObservations.forEach(obs => {
      moodStats[obs.mood] = (moodStats[obs.mood] || 0) + 1;
    });

    return {
      total: periodObservations.length,
      moodStats
    };
  };

  // 打开编辑模态框
  const openEditModal = (observation: Observation) => {
    setEditingObservation(observation);
    setEditForm({
      mood: observation.mood,
      content: observation.content,
      date: observation.date
    });
    setShowEditModal(true);
  };

  // 处理编辑表单变化
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editingObservation) return;

    try {
      const updatedObservations = observations.map(obs => 
        obs.id === editingObservation.id ? {
          ...obs,
          mood: editForm.mood,
          content: editForm.content,
          date: editForm.date
        } : obs
      );

      saveObservation(updatedObservations);
      setObservations(updatedObservations);
      setShowEditModal(false);
      setEditingObservation(null);
      alert('编辑成功！');
    } catch (error) {
      console.error('编辑失败:', error);
      alert('编辑失败，请重试');
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setShowEditModal(false);
    setEditingObservation(null);
  };

  // 删除观察日志
  const deleteObservation = (id: string) => {
    // 使用Promise封装confirm，确保异步操作的正确性
    new Promise<boolean>((resolve) => {
      const result = window.confirm('确定要删除这条观察记录吗？此操作不可恢复。');
      resolve(result);
    }).then((confirmed) => {
      console.log('Delete confirmation result:', confirmed);
      if (confirmed) {
        try {
          console.log('Attempting to delete observation with id:', id);
          const updatedObservations = observations.filter(obs => obs.id !== id);
          console.log('Updated observations count:', updatedObservations.length);
          saveObservation(updatedObservations);
          setObservations(updatedObservations);
          alert('删除成功！');
        } catch (error) {
          console.error('删除失败:', error);
          alert('删除失败，请重试');
        }
      } else {
        console.log('Delete operation cancelled by user');
      }
    });
  };

  const stats = calculateStats();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">观察日志</h2>
          <p className="text-gray-400">记录与老婆的点点滴滴，珍贵回忆值得珍藏</p>
        </div>

        {/* 搜索和筛选区域 */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl border border-purple-800/50 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 关键词搜索 */}
            <div>
              <h3 className="text-sm text-gray-400 mb-2">关键词搜索</h3>
              <input
                type="text"
                placeholder="搜索内容或心情..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* 日期筛选 */}
            <div>
              <h3 className="text-sm text-gray-400 mb-2">按日期检索</h3>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* 添加按钮 */}
            <div className="flex items-end">
              <button
                onClick={() => setShowAddObservationModal(true)}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                添加记录
              </button>
            </div>
          </div>
        </div>

        {/* 统计区域 */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl border border-purple-800/50 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">统计分析</h3>
            <div className="flex space-x-2">
              {(['week', 'month', 'quarter', 'year'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setStatsPeriod(period)}
                  className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 ${statsPeriod === period ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  {period === 'week' ? '周' : period === 'month' ? '月' : period === 'quarter' ? '季度' : '年'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 总记录数 */}
            <div className="bg-gray-800/80 rounded-lg p-4 border border-purple-700/30">
              <h4 className="text-gray-400 mb-2">总记录数</h4>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>

            {/* 心情分布 */}
            <div className="bg-gray-800/80 rounded-lg p-4 border border-purple-700/30">
              <h4 className="text-gray-400 mb-4">心情分布</h4>
              <div className="space-y-2">
                {Object.entries(stats.moodStats).map(([mood, count]) => (
                  <div key={mood} className="flex justify-between items-center">
                    <span className="text-xl mr-2">{mood}</span>
                    <span className="text-white font-bold">{count}次</span>
                    <div className="flex-1 ml-4 bg-gray-700/50 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 观察日志时间轴 */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl border border-purple-800/50 p-6">
          <h3 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">观察日志时间轴</h3>

          {filteredObservations.length > 0 ? (
            <div className="space-y-6">
              {filteredObservations.map((obs, index) => (
                <div 
                  key={obs.id} 
                  className={`bg-gray-800/80 rounded-lg border border-purple-700/30 transition-all duration-300 ${expandedObservations.has(obs.id) ? 'shadow-lg' : 'shadow'}`}
                >
                  {/* 时间轴头部 */}
                  <div 
                    className="p-4 cursor-pointer flex justify-between items-center"
                    onClick={() => toggleObservation(obs.id)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold mr-4">
                        {obs.mood}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{obs.date}</h4>
                        <p className="text-gray-400 text-sm line-clamp-2">{obs.content.substring(0, 100)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(obs);
                        }}
                        className="text-gray-400 hover:text-pink-400 transition-colors duration-200"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteObservation(obs.id);
                        }}
                        className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                      >
                        🗑️
                      </button>
                      <div className="text-gray-400">
                        {expandedObservations.has(obs.id) ? '▼' : '▶'}
                      </div>
                    </div>
                  </div>

                  {/* 展开内容 */}
                  {expandedObservations.has(obs.id) && (
                    <div className="p-4 pt-0 border-t border-purple-700/30">
                      <div className="prose prose-invert max-w-none">
                        {obs.content.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                      {obs.images && obs.images.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          {obs.images.map((img, i) => (
                            <img 
                              key={i} 
                              src={img} 
                              alt={`Observation ${index}`}
                              className="rounded-lg w-full h-40 object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">暂无观察日志</p>
          )}
        </div>
      </div>

      {/* 编辑观察日志模态框 */}
      {showEditModal && editingObservation && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-500 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-purple-800 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">编辑观察记录</h3>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            <form className="space-y-6">
              {/* 日期 */}
              <div>
                <label className="block text-gray-400 mb-2">日期</label>
                <input
                  type="date"
                  name="date"
                  value={editForm.date}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              {/* 心情 */}
              <div>
                <label className="block text-gray-400 mb-2">心情</label>
                <select
                  name="mood"
                  value={editForm.mood}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                >
                  <option value="😊">😊 开心</option>
                  <option value="😢">😢 难过</option>
                  <option value="😠">😠 生气</option>
                  <option value="😰">😰 焦虑</option>
                  <option value="😌">😌 平静</option>
                  <option value="😍">😍 惊喜</option>
                </select>
              </div>

              {/* 内容 */}
              <div>
                <label className="block text-gray-400 mb-2">内容</label>
                <textarea
                  name="content"
                  value={editForm.content}
                  onChange={handleEditFormChange}
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="记录下你观察到的细节..."
                  required
                />
              </div>

              {/* 按钮组 */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 px-6 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white hover:bg-gray-700/80 transition-colors duration-300"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default ObservationLog;