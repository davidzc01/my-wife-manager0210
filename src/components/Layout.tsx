import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { loadData, saveObservation, saveImages, saveCycleData, saveExpenseData } from '../services/storage';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { showSexModal, setShowSexModal, showWishModal, setShowWishModal, showAddObservationModal, setShowAddObservationModal, setObservationUpdated } = useModal();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newObservation, setNewObservation] = useState<{
    mood: string;
    content: string;
    image: string | null;
    imageType: 'SFW' | 'NSFW';
    date: string;
  }>(() => {
    // 从sessionStorage中恢复临时图片
    const tempImage = sessionStorage.getItem('tempGalleryImage');
    return {
      mood: '',
      content: '',
      image: tempImage || null,
      imageType: 'SFW',
      date: new Date().toISOString().split('T')[0]
    };
  });
  
  // 生理弹窗相关状态
  const [newSexRecord, setNewSexRecord] = useState<{
    location: string;
    position: string;
    ejaculation: boolean;
    ejaculationLocation: string;
    feelings: string;
  }>({ location: '', position: '', ejaculation: false, ejaculationLocation: '', feelings: '' });
  
  // 编辑做爱记录相关状态
  const [isEditingSexRecord, setIsEditingSexRecord] = useState(false);
  const [editingSexRecordId, setEditingSexRecordId] = useState<string>('');
  const [editingSexRecord, setEditingSexRecord] = useState<{
    location: string;
    position: string;
    ejaculation: boolean;
    ejaculationLocation: string;
    feelings: string;
  }>({ location: '', position: '', ejaculation: false, ejaculationLocation: '', feelings: '' });
  
  // 消费弹窗相关状态
  const [newWishlistItem, setNewWishlistItem] = useState<{
    name: string;
    price: number;
    link: string;
    priority: '低' | '中' | '高';
    notes: string;
  }>({ name: '', price: 0, link: '', priority: '中', notes: '' });
  const [newExpense, setNewExpense] = useState<{
    name: string;
    type: string;
    supplier: string;
    price: number;
    occasion: string;
    reaction: string;
    notes: string;
  }>({ name: '', type: '', supplier: '', price: 0, occasion: '', reaction: '', notes: '' });
  const [wishModalMode, setWishModalMode] = useState<'wishlist' | 'expense'>('wishlist');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event?.target?.result;
        if (result) {
          setNewObservation(prev => ({ ...prev, image: result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 处理观察日志提交
  const handleObservationSubmit = () => {
    try {
      // 加载现有数据
      const data = loadData();
      if (data === null) {
        throw new Error('无法加载现有数据');
      }
      
      // 创建新的观察记录
      const newObs = {
        id: Date.now().toString(),
        date: newObservation.date,
        mood: newObservation.mood,
        content: newObservation.content,
        images: newObservation.image ? [newObservation.image] : undefined
      };

      // 更新观察记录
      const updatedObservations = [newObs, ...(data.observations || [])];
      saveObservation(updatedObservations);

      // 如果有上传图片，添加到画廊
      if (newObservation.image) {
        const newImage = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          url: newObservation.image,
          type: newObservation.imageType,
          uploadedAt: new Date().toISOString(),
          description: `观察记录 - ${newObservation.date}`
        };

        const updatedImages = [newImage, ...(data.images || [])];
        saveImages(updatedImages);
      }

      // 清除临时图片存储
      sessionStorage.removeItem('tempGalleryImage');
      
      // 重置表单
      setNewObservation({ 
        mood: '', 
        content: '', 
        image: null, 
        imageType: 'SFW',
        date: new Date().toISOString().split('T')[0]
      });
      
      // 通知ObservationLog组件数据已更新
      setObservationUpdated(true);
      
      setShowAddObservationModal(false);
      
      // 提示用户保存成功
      alert('保存成功！');
    } catch (error) {
      console.error('保存观察记录失败:', error);
      alert('保存失败，请重试');
    }
  };

  // 处理做爱记录
  const handleSexRecord = () => {
    try {
      // 加载现有数据
      const data = loadData();
      if (data === null) {
        throw new Error('无法加载现有数据');
      }
      const cycleData = data.cycle || {
        lastPeriodStart: new Date().toISOString().split('T')[0],
        cycleLength: 28,
        periodLength: 5,
        sexRecords: []
      };

      const newRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        location: newSexRecord.location,
        position: newSexRecord.position,
        ejaculation: newSexRecord.ejaculation,
        ejaculationLocation: newSexRecord.ejaculation ? newSexRecord.ejaculationLocation : undefined,
        feelings: newSexRecord.feelings || undefined
      };

      const updatedRecords = [...(cycleData.sexRecords || []), newRecord];
      const updatedCycleData = { ...cycleData, sexRecords: updatedRecords };
      saveCycleData(updatedCycleData);
      
      // 重置表单
      setNewSexRecord({ location: '', position: '', ejaculation: false, ejaculationLocation: '', feelings: '' });
      setShowSexModal(false);
      
      // 提示用户保存成功
      alert('保存成功！');
    } catch (error) {
      console.error('保存性爱记录失败:', error);
      alert('保存失败，请重试');
    }
  };

  // 处理来姨妈
  const handlePeriodStart = () => {
    try {
      // 加载现有数据
      const data = loadData();
      if (data === null) {
        throw new Error('无法加载现有数据');
      }
      const cycleData = data.cycle || {
        lastPeriodStart: new Date().toISOString().split('T')[0],
        cycleLength: 28,
        periodLength: 5,
        sexRecords: []
      };

      const updatedCycleData = {
        ...cycleData,
        lastPeriodStart: new Date().toISOString().split('T')[0]
      };
      saveCycleData(updatedCycleData);
      
      // 提示用户保存成功
      alert('生理期状态已更新！');
    } catch (error) {
      console.error('更新生理期状态失败:', error);
      alert('更新失败，请重试');
    }
  };
  
  // 处理编辑做爱记录 - 暂时保留以备将来使用
  // const handleEditSexRecord = (recordId: string, record: {
  //   location?: string;
  //   position?: string;
  //   ejaculation: boolean;
  //   ejaculationLocation?: string;
  //   feelings?: string;
  // }) => {
  //   setIsEditingSexRecord(true);
  //   setEditingSexRecordId(recordId);
  //   setEditingSexRecord({
  //     location: record.location || '',
  //     position: record.position || '',
  //     ejaculation: record.ejaculation,
  //     ejaculationLocation: record.ejaculationLocation || '',
  //     feelings: record.feelings || ''
  //   });
  //   setShowSexModal(true);
  // };
  
  // 处理保存编辑的做爱记录
  const handleSaveEditedSexRecord = () => {
    try {
      // 加载现有数据
      const data = loadData();
      if (data === null) {
        throw new Error('无法加载现有数据');
      }
      const cycleData = data.cycle || {
        lastPeriodStart: new Date().toISOString().split('T')[0],
        cycleLength: 28,
        periodLength: 5,
        sexRecords: []
      };

      const updatedRecords = cycleData.sexRecords.map((record: {
        id: string;
        date: string;
        location?: string;
        position?: string;
        ejaculation: boolean;
        ejaculationLocation?: string;
        feelings?: string;
      }) => {
        if (record.id === editingSexRecordId) {
          return {
            ...record,
            location: editingSexRecord.location,
            position: editingSexRecord.position,
            ejaculation: editingSexRecord.ejaculation,
            ejaculationLocation: editingSexRecord.ejaculation ? editingSexRecord.ejaculationLocation : undefined,
            feelings: editingSexRecord.feelings || undefined
          };
        }
        return record;
      });

      const updatedCycleData = { ...cycleData, sexRecords: updatedRecords };
      saveCycleData(updatedCycleData);
      
      // 重置编辑状态
      setIsEditingSexRecord(false);
      setEditingSexRecordId('');
      setEditingSexRecord({ location: '', position: '', ejaculation: false, ejaculationLocation: '', feelings: '' });
      setShowSexModal(false);
      
      // 提示用户保存成功
      alert('做爱记录已更新！');
    } catch (error) {
      console.error('更新做爱记录失败:', error);
      alert('更新失败，请重试');
    }
  };

  // 处理愿望单提交
  const handleWishlistSubmit = () => {
    try {
      // 加载现有数据
      const data = loadData();
      if (data === null) {
        throw new Error('无法加载现有数据');
      }
      const currentExpenses = data.expenses || { expenses: [], wishlist: [] };
      
      const newItem = {
        id: Date.now().toString(),
        name: newWishlistItem.name,
        price: newWishlistItem.price,
        link: newWishlistItem.link,
        priority: newWishlistItem.priority,
        notes: newWishlistItem.notes
      };

      const updatedWishlist = [...currentExpenses.wishlist, newItem];
      const updatedExpenses = {
        ...currentExpenses,
        wishlist: updatedWishlist
      };

      // 保存数据
      saveExpenseData(updatedExpenses);

      // 重置表单
      setNewWishlistItem({ name: '', price: 0, link: '', priority: '中', notes: '' });
      setShowWishModal(false);
      
      // 提示用户保存成功
      alert('保存成功！');
    } catch (error) {
      console.error('保存愿望单失败:', error);
      alert('保存失败，请重试');
    }
  };

  // 处理消费记录提交
  const handleExpenseSubmit = () => {
    try {
      // 加载现有数据
      const data = loadData();
      if (data === null) {
        throw new Error('无法加载现有数据');
      }
      const currentExpenses = data.expenses || { expenses: [], wishlist: [] };
      
      const newExpenseItem = {
        id: Date.now().toString(),
        name: newExpense.name,
        type: newExpense.type,
        supplier: newExpense.supplier,
        price: newExpense.price,
        date: new Date().toISOString().split('T')[0],
        occasion: newExpense.occasion,
        reaction: newExpense.reaction,
        notes: newExpense.notes
      };

      const updatedExpenses = {
        ...currentExpenses,
        expenses: [...currentExpenses.expenses, newExpenseItem]
      };

      // 保存数据
      saveExpenseData(updatedExpenses);
      
      // 重置表单
      setNewExpense({ name: '', type: '', supplier: '', price: 0, occasion: '', reaction: '', notes: '' });
      setShowWishModal(false);
      
      // 提示用户保存成功
      alert('保存成功！');
    } catch (error) {
      console.error('保存消费记录失败:', error);
      alert('保存失败，请重试');
    }
  };

  // 导航菜单
  const navItems = [
    { name: '首页', path: '/', icon: '🏠' },
    { name: '用户档案', path: '/user', icon: '👤' },
    { name: '老婆档案', path: '/wife', icon: '👩' },
    { name: '生理周期', path: '/cycle', icon: '🌸' },
    { name: '图片画廊', path: '/gallery', icon: '🖼️' },
    { name: '消费记录', path: '/expense', icon: '💰' },
    { name: '观察日志', path: '/observation', icon: '📝' },
  ];

  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 切换下拉菜单
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* 顶部导航栏 - 固定在移动端 */}
      <nav className="bg-gradient-to-r from-gray-900 to-gray-800 bg-opacity-95 backdrop-blur-md border-b border-purple-800/50 py-5 px-8 shadow-lg z-[400] relative md:relative sticky top-0">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">老婆管理器</h1>
          </div>
          <div className="flex items-center space-x-6" ref={dropdownRef}>
            {/* 用户头像和用户名区域 */}
            <div className="relative">
              <div 
                className="flex items-center space-x-3 cursor-pointer" 
                onClick={toggleDropdown}
              >
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Avatar" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-pink-500 shadow-lg"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                    {user?.nickname?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="text-pink-300 font-medium">{user?.nickname || '用户'}</span>
              </div>

              {/* 下拉菜单 */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl border border-purple-800/50 py-2 z-[500]">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 block px-6 py-3 rounded-lg transition-all duration-300 ease-in-out ${
                        location.pathname === item.path
                          ? 'bg-gradient-to-r from-pink-600/30 to-purple-600/30 text-pink-300'
                          : 'text-pink-300 hover:bg-pink-600/20'
                      }`}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
                  <div className="border-t border-purple-800/30 my-1"></div>
                  <button
                    onClick={() => {
                      logout();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 text-left px-6 py-3 text-red-400 hover:bg-red-600/20 rounded-lg transition-all duration-300 ease-in-out"
                  >
                    <span className="text-xl">🚪</span>
                    <span className="font-medium">退出登录</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 - 添加底部padding以避免被固定的底部菜单栏遮挡 */}
      <div className="container mx-auto px-4 py-10 pb-32 md:pb-10">
        {/* 内容区域 */}
        <div className="w-full">
          {children}
        </div>
      </div>

      {/* 移动端底部菜单栏 - 固定在底部 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-gray-800 bg-opacity-95 backdrop-blur-md border-t border-purple-800/50 py-4 px-6 shadow-lg z-[400] md:hidden">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-pink-600/20">
            <span className="text-2xl">🏠</span>
            <span className="text-xs text-pink-300">首页</span>
          </Link>
          <button onClick={() => setShowSexModal(true)} className="flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-pink-600/20">
            <span className="text-2xl">🌸</span>
            <span className="text-xs text-pink-300">生理</span>
          </button>
          <button onClick={() => setShowWishModal(true)} className="flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-pink-600/20">
            <span className="text-2xl">💰</span>
            <span className="text-xs text-pink-300">消费</span>
          </button>
          <button onClick={() => setShowAddObservationModal(true)} className="flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-pink-600/20">
            <span className="text-2xl">📝</span>
            <span className="text-xs text-pink-300">记录</span>
          </button>
        </div>
      </div>

      {/* 底部信息 - 只在桌面端显示 */}
      <footer className="mt-20 py-8 bg-gradient-to-r from-gray-900 to-gray-800 bg-opacity-95 backdrop-blur-md border-t border-purple-800/50 shadow-lg md:block hidden">
        <div className="container mx-auto px-4 text-center">
          <p className="text-pink-300 font-medium">老婆管理器 © {new Date().getFullYear()}</p>
          <p className="text-gray-400 mt-2">专为爱护老婆的好丈夫设计</p>
        </div>
      </footer>

      {/* 观察记录弹窗 - 在任何页面都能显示 */}
      {showAddObservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-500 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-purple-800 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">记一笔</h3>
            
            <div className="space-y-6">
              {/* 日期选择 */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">日期</label>
                <input
                  type="date"
                  value={newObservation.date}
                  onChange={(e) => setNewObservation(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              {/* 状态/心情 - 下拉菜单 */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">状态/心情</label>
                <select
                  value={newObservation.mood}
                  onChange={(e) => setNewObservation(prev => ({ ...prev, mood: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">请选择心情</option>
                  <option value="😊">😊 开心</option>
                  <option value="😢">😢 伤心</option>
                  <option value="😠">😠 生气</option>
                  <option value="😴">😴 疲惫</option>
                  <option value="😳">😳 惊讶</option>
                  <option value="🤔">🤔 思考</option>
                  <option value="😍">😍 喜欢</option>
                  <option value="🤩">🤩 兴奋</option>
                </select>
              </div>
              
              {/* 文本输入 */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">内容（支持Markdown）</label>
                <textarea 
                  value={newObservation.content}
                  onChange={(e) => setNewObservation(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full h-40 px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  placeholder="记录今天的观察..."
                />
              </div>
              
              {/* 图片上传 - 紧凑按钮 */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">图片上传</label>
                {newObservation.image ? (
                  <div className="relative mb-4">
                    <img 
                      src={newObservation.image} 
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button 
                      onClick={() => setNewObservation(prev => ({ ...prev, image: null }))}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center space-x-2">
                    <input 
                      type="file" 
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <span>📷</span>
                    <span>上传图片</span>
                  </label>
                )}
                
                {/* SFW/NSFW选择 */}
                {newObservation.image && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-400 mb-2">图片类型</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setNewObservation(prev => ({ ...prev, imageType: 'SFW' }))}
                        className={`flex-1 px-4 py-2 rounded-lg transition-all duration-300 ${newObservation.imageType === 'SFW' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      >
                        SFW (安全)
                      </button>
                      <button
                        onClick={() => setNewObservation(prev => ({ ...prev, imageType: 'NSFW' }))}
                        className={`flex-1 px-4 py-2 rounded-lg transition-all duration-300 ${newObservation.imageType === 'NSFW' ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      >
                        NSFW (不安全)
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 按钮 */}
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setShowAddObservationModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
                >
                  取消
                </button>
                <button 
                  onClick={handleObservationSubmit}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 生理弹窗 - 在任何页面都能显示 */}
      {showSexModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-500 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-purple-800 p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">生理</h3>
            
            <div className="space-y-6">
              {/* 快捷选项 */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    // 这里可以添加一个新的状态来控制弹窗模式
                    // 暂时直接显示详细记录
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl flex flex-col items-center"
                >
                  <span className="text-2xl mb-2">💏</span>
                  <span className="text-sm">快捷记录性爱</span>
                </button>
                <button 
                  onClick={handlePeriodStart}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl flex flex-col items-center"
                >
                  <span className="text-2xl mb-2">🌸</span>
                  <span className="text-sm">更新生理期状态</span>
                </button>
              </div>
              
              {/* 详细记录性爱 */}
              <div className="border-t border-purple-800/30 pt-6">
                <h4 className="text-lg font-bold text-white mb-4">详细记录性爱</h4>
                
                <div className="space-y-4">
                  {/* 日期 */}
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">日期</h4>
                    <p className="text-xl font-bold text-white">{new Date().toLocaleDateString()}</p>
                  </div>
                  
                  {/* 地点 */}
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">地点</h4>
                    <input
                      type="text"
                      placeholder="例如：卧室、客厅、酒店等"
                      value={isEditingSexRecord ? editingSexRecord.location : newSexRecord.location}
                      onChange={(e) => {
                        if (isEditingSexRecord) {
                          setEditingSexRecord(prev => ({ ...prev, location: e.target.value }));
                        } else {
                          setNewSexRecord(prev => ({ ...prev, location: e.target.value }));
                        }
                      }}
                      className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* 姿势 */}
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">姿势</h4>
                    <input
                      type="text"
                      placeholder="例如：传教士、女上位、后入等"
                      value={isEditingSexRecord ? editingSexRecord.position : newSexRecord.position}
                      onChange={(e) => {
                        if (isEditingSexRecord) {
                          setEditingSexRecord(prev => ({ ...prev, position: e.target.value }));
                        } else {
                          setNewSexRecord(prev => ({ ...prev, position: e.target.value }));
                        }
                      }}
                      className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* 是否射精 */}
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">是否射精</h4>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isEditingSexRecord ? editingSexRecord.ejaculation : newSexRecord.ejaculation}
                        onChange={(e) => {
                          if (isEditingSexRecord) {
                            setEditingSexRecord(prev => ({ ...prev, ejaculation: e.target.checked }));
                          } else {
                            setNewSexRecord(prev => ({ ...prev, ejaculation: e.target.checked }));
                          }
                        }}
                        className="w-5 h-5 text-pink-500 border-gray-600 rounded focus:ring-pink-500"
                      />
                      <span className="ml-3 text-white">是</span>
                    </div>
                  </div>
                  
                  {/* 射精部位 */}
                  {isEditingSexRecord ? (
                    editingSexRecord.ejaculation && (
                      <div>
                        <h4 className="text-sm text-gray-400 mb-2">射精部位</h4>
                        <input
                          type="text"
                          placeholder="例如：体内、体外、口中、乳中等"
                          value={editingSexRecord.ejaculationLocation}
                          onChange={(e) => setEditingSexRecord(prev => ({ ...prev, ejaculationLocation: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      </div>
                    )
                  ) : (
                    newSexRecord.ejaculation && (
                      <div>
                        <h4 className="text-sm text-gray-400 mb-2">射精部位</h4>
                        <input
                          type="text"
                          placeholder="例如：体内、体外、口中、乳中等"
                          value={newSexRecord.ejaculationLocation}
                          onChange={(e) => setNewSexRecord(prev => ({ ...prev, ejaculationLocation: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      </div>
                    )
                  )}
                  
                  {/* 感受 */}
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">感受</h4>
                    <textarea
                      placeholder="例如：很愉快、很满足、很刺激等"
                      value={isEditingSexRecord ? editingSexRecord.feelings : newSexRecord.feelings}
                      onChange={(e) => {
                        if (isEditingSexRecord) {
                          setEditingSexRecord(prev => ({ ...prev, feelings: e.target.value }));
                        } else {
                          setNewSexRecord(prev => ({ ...prev, feelings: e.target.value }));
                        }
                      }}
                      className="w-full h-24 px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
              
              {/* 按钮 */}
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => {
                    setShowSexModal(false);
                    if (isEditingSexRecord) {
                      setIsEditingSexRecord(false);
                      setEditingSexRecordId('');
                      setEditingSexRecord({ location: '', position: '', ejaculation: false, ejaculationLocation: '', feelings: '' });
                    }
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
                >
                  取消
                </button>
                {isEditingSexRecord ? (
                  <button 
                    onClick={handleSaveEditedSexRecord}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
                  >
                    更新记录
                  </button>
                ) : (
                  <button 
                    onClick={handleSexRecord}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
                  >
                    保存记录
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 消费弹窗 - 在任何页面都能显示 */}
      {showWishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-500 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-purple-800 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">消费</h3>
            
            {/* 模式切换 */}
            <div className="flex space-x-4 mb-8">
              <button
                onClick={() => setWishModalMode('wishlist')}
                className={`flex-1 py-3 px-4 rounded-lg transition-all duration-300 ${wishModalMode === 'wishlist' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                愿望单
              </button>
              <button
                onClick={() => setWishModalMode('expense')}
                className={`flex-1 py-3 px-4 rounded-lg transition-all duration-300 ${wishModalMode === 'expense' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                消费记录
              </button>
            </div>
            
            {wishModalMode === 'wishlist' ? (
              /* 愿望单表单 */
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">物品名称</h4>
                  <input
                    type="text"
                    placeholder="例如：口红、包包、香水等"
                    value={newWishlistItem.name}
                    onChange={(e) => setNewWishlistItem(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">价格 (¥)</h4>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newWishlistItem.price}
                    onChange={(e) => setNewWishlistItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">链接</h4>
                  <input
                    type="url"
                    placeholder="例如：https://example.com/product"
                    value={newWishlistItem.link}
                    onChange={(e) => setNewWishlistItem(prev => ({ ...prev, link: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">优先级</h4>
                  <select
                    value={newWishlistItem.priority}
                    onChange={(e) => setNewWishlistItem(prev => ({ ...prev, priority: e.target.value as '低' | '中' | '高' }))}
                    className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="低">低</option>
                    <option value="中">中</option>
                    <option value="高">高</option>
                  </select>
                </div>
                
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">备注</h4>
                  <textarea
                    placeholder="例如：她之前提到过很喜欢这个牌子的口红"
                    value={newWishlistItem.notes}
                    onChange={(e) => setNewWishlistItem(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full h-24 px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div className="flex gap-4 mt-8">
                  <button 
                    onClick={() => setShowWishModal(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleWishlistSubmit}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              /* 消费记录表单 */
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">礼物名称</h4>
                  <input
                    type="text"
                    placeholder="例如：口红、包包、香水等"
                    value={newExpense.name}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">类型</h4>
                  <input
                    type="text"
                    placeholder="例如：化妆品、配饰、电子产品等"
                    value={newExpense.type}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">供应商</h4>
                  <input
                    type="text"
                    placeholder="例如：天猫、京东、专柜等"
                    value={newExpense.supplier}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">价格 (¥)</h4>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newExpense.price}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">事由</h4>
                  <input
                    type="text"
                    placeholder="例如：生日、情人节、纪念日等"
                    value={newExpense.occasion}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, occasion: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">反应</h4>
                  <input
                    type="text"
                    placeholder="例如：很高兴、很喜欢、非常惊喜等"
                    value={newExpense.reaction}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, reaction: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">备注</h4>
                  <textarea
                    placeholder="例如：她打开礼物时的表情非常可爱，说这是她收到的最好的礼物之一"
                    value={newExpense.notes}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full h-24 px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div className="flex gap-4 mt-8">
                  <button 
                    onClick={() => setShowWishModal(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleExpenseSubmit}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
                  >
                    保存
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;