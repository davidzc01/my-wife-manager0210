import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { loadData, saveCycleData, saveObservation, saveImages, saveExpenseData } from '../services/storage';
import Layout from './Layout';

interface WifeData {
  name: string;
  birthday: string;
  height?: number;
  weight?: number;
  measurements?: {
    bust: number;
    waist: number;
    hips: number;
  };
  avatar: string;
  anniversaries: Array<{
    date: string;
    title: string;
    description?: string;
  }>;
}

interface CycleData {
  lastPeriodStart: string;
  cycleLength: number;
  periodLength: number;
  sexRecords: Array<{
    id: string;
    date: string;
    location?: string;
    position?: string;
    ejaculation: boolean;
    ejaculationLocation?: string;
    notes?: string;
  }>;
}

interface Image {
  id: string;
  url: string;
  type: 'SFW' | 'NSFW';
  uploadedAt: string;
  description?: string;
}

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  link: string;
  priority: '低' | '中' | '高';
  notes?: string;
}

interface Observation {
  id: string;
  date: string;
  mood: string;
  content: string;
  images?: string[];
}



const Dashboard: React.FC = () => {
  useAuth();
  const [wifeData, setWifeData] = useState<WifeData | null>(null);
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [cycleStatus, setCycleStatus] = useState<{ status: string; color: string }>({ status: '未知', color: 'gray' });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { setShowSexModal, setShowWishModal, setShowAddObservationModal } = useModal();

  // 加载数据
  useEffect(() => {
    const data = loadData();
    if (data) {
      setWifeData(data.wife || null);
      setCycleData(data.cycle || null);
      setImages(data.images || []);
      setWishlist(data.expenses?.wishlist || []);
      setObservations(data.observations || []);
    }
  }, []);

  // 计算生理周期状态
  useEffect(() => {
    if (cycleData?.lastPeriodStart) {
      const today = new Date();
      const lastPeriod = new Date(cycleData.lastPeriodStart);
      const daysSinceLastPeriod = Math.floor(
        (today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24)
      );

      const currentDay = daysSinceLastPeriod % cycleData.cycleLength;
      let status = '未知';
      let color = 'gray';

      if (currentDay < cycleData.periodLength) {
        status = '经期';
        color = 'red';
      } else if (currentDay >= 10 && currentDay <= 17) {
        status = '排卵期';
        color = 'yellow';
      } else if (currentDay >= 18 && currentDay <= 24) {
        status = '黄体期';
        color = 'blue';
      } else {
        status = '安全期';
        color = 'green';
      }

      setCycleStatus({ status, color });
    }
  }, [cycleData]);



  // 计算年龄
  const calculateAge = (birthday: string) => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // 计算距上次做爱时间
  const getDaysSinceLastSex = () => {
    if (!cycleData?.sexRecords || cycleData.sexRecords.length === 0) {
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

  // 计算纪念日倒数
  const calculateAnniversaryCountdown = (date: string) => {
    const today = new Date();
    // 只比较月和日，忽略年份
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    
    const annivDate = new Date(date);
    const annivMonth = annivDate.getMonth();
    const annivDay = annivDate.getDate();
    
    // 创建今年的纪念日日期
    const currentYearAnniv = new Date(today.getFullYear(), annivMonth, annivDay);
    
    // 检查今天是否是纪念日
    if (todayMonth === annivMonth && todayDate === annivDay) {
      return 0;
    }
    
    // 如果今年的纪念日已经过了，使用明年的
    if (currentYearAnniv < today) {
      const nextYearAnniv = new Date(today.getFullYear() + 1, annivMonth, annivDay);
      const diffTime = nextYearAnniv.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // 否则使用今年的
    const diffTime = currentYearAnniv.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };





  // 排序愿望单（按优先级和时间）
  const sortedWishlist = [...wishlist]
    .sort((a, b) => {
      const priorityOrder = { '高': 0, '中': 1, '低': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);

  // 排序纪念日（按倒数日）
  const sortedAnniversaries = wifeData?.anniversaries
    ? [...wifeData.anniversaries]
      .map(anniv => ({
        ...anniv,
        countdown: calculateAnniversaryCountdown(anniv.date)
      }))
      .sort((a, b) => a.countdown - b.countdown)
      .slice(0, 3)
    : [];

  // 过滤SFW图片
  const sfwImages = images.filter(img => img.type === 'SFW');

  // 渲染老婆档案为空的页面
  if (!wifeData || !wifeData.name) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
          <div className="bg-gradient-to-br from-pink-600 to-purple-700 rounded-2xl shadow-2xl p-12 max-w-2xl">
            <h2 className="text-4xl font-bold mb-6 text-white">首先，你需要一个老婆</h2>
            <p className="text-xl text-pink-100 mb-8">
              没有老婆的人生是不完整的！请先创建一个老婆档案，开始你的幸福生活。
            </p>
            <Link to="/wife">
              <button className="bg-white text-pink-600 hover:bg-pink-100 font-bold py-4 px-8 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105">
                添加老婆档案
              </button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* 主内容区 */}
      <div className="container mx-auto px-4 py-8">
        {/* 纪念日Banner - 只在移动设备且7天内有纪念日或当天是纪念日时显示 */}
        {sortedAnniversaries.length > 0 && sortedAnniversaries[0].countdown <= 7 && (
          <div className="md:hidden mb-6">
            <Link to="/expense?tab=wishlist" className="block bg-gradient-to-r from-pink-600 to-purple-700 rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">💖 {sortedAnniversaries[0].countdown === 0 ? '今天是纪念日！' : '即将到来的纪念日'}</h3>
                  <p className="text-white/90">{sortedAnniversaries[0].title} - {sortedAnniversaries[0].countdown === 0 ? '今天' : `${sortedAnniversaries[0].countdown}天后`}</p>
                </div>
                <span className="text-2xl">🎁</span>
              </div>
            </Link>
          </div>
        )}
        
        {/* 顶部区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* 左侧：老婆档案卡片 */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl border border-purple-800/50 overflow-hidden">
              {/* 卡片头部 - 只在桌面端显示 */}
              <div className="bg-gradient-to-r from-pink-600 to-purple-700 p-6 md:block hidden">
                <h2 className="text-2xl font-bold text-white">{wifeData.name} 的档案</h2>
              </div>
              
              {/* 卡片内容 */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* 左侧图片 */}
                  <div className="md:w-1/3">
                    <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-pink-500/50">
                      {/* 移动设备端：可左右滑动切换图片 */}
                      {sfwImages.length > 0 ? (
                        <div className="relative w-full h-80 overflow-hidden md:block">
                          {/* 图片容器 */}
                          <div 
                            className="flex transition-transform duration-300 ease-out"
                            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                          >
                            {sfwImages.map((image, index) => (
                              <div key={index} className="w-full flex-shrink-0 h-80 flex items-center justify-center">
                                <img 
                                  src={image.url} 
                                  alt={`Image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                          
                          {/* 左右滑动按钮 */}
                          <button 
                            onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : sfwImages.length - 1))}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center"
                          >
                            ←
                          </button>
                          <button 
                            onClick={() => setCurrentImageIndex((prev) => (prev < sfwImages.length - 1 ? prev + 1 : 0))}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center"
                          >
                            →
                          </button>
                          
                          {/* 图片指示器 */}
                          <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                            {sfwImages.map((_, index) => (
                              <button 
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-pink-500 w-6' : 'bg-white/50'}`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : wifeData.avatar ? (
                        <img 
                          src={wifeData.avatar} 
                          alt={wifeData.name}
                          className="w-full h-80 object-cover"
                        />
                      ) : (
                        <div className="w-full h-80 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                          <span className="text-4xl font-bold text-white">{wifeData.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 右侧信息 */}
                  <div className="md:w-2/3 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm text-gray-400">姓名</h3>
                        <p className="text-xl font-bold text-white">{wifeData.name}</p>
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-400">年龄</h3>
                        <p className="text-xl font-bold text-white">{calculateAge(wifeData.birthday)}岁</p>
                      </div>
                      {wifeData.height && (
                        <div>
                          <h3 className="text-sm text-gray-400">身高</h3>
                          <p className="text-xl font-bold text-white">{wifeData.height} cm</p>
                        </div>
                      )}
                      {wifeData.weight && (
                        <div>
                          <h3 className="text-sm text-gray-400">体重</h3>
                          <p className="text-xl font-bold text-white">{wifeData.weight} kg</p>
                        </div>
                      )}
                    </div>
                    

                    
                    <div className="grid grid-cols-2 gap-4">
                      {wifeData.height && wifeData.weight && (
                        <div className="flex items-center">
                          <div>
                            <h3 className="text-sm text-gray-400">BMI</h3>
                            {(() => {
                              const bmi = wifeData.weight / ((wifeData.height / 100) ** 2);
                              let bmiStatus = '';
                              if (bmi < 18.5) {
                                bmiStatus = '偏瘦';
                              } else if (bmi < 24) {
                                bmiStatus = '健康的身形';
                              } else if (bmi < 28) {
                                bmiStatus = '微胖';
                              } else {
                                bmiStatus = '偏胖';
                              }
                              return (
                                <p className="text-xl font-bold text-white">{bmi.toFixed(1)} ({bmiStatus})</p>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      
                      {/* 状态宝石 - 可操状态与最近一次性爱 */}
                      <div className="flex items-center">
                        {/* 状态宝石 */}
                        <div className="relative group z-10">
                          {/* 宝石中心 - 只用不同颜色的心形emoji */}
                          <div className="text-3xl animate-pulse">
                            {cycleStatus.color === 'red' ? '❤️' : cycleStatus.color === 'green' ? '💚' : cycleStatus.color === 'yellow' ? '💛' : '🤍'}
                          </div>
                          {/* ToolTip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-500" style={{ minWidth: '150px' }}>
                            {cycleStatus.color === 'red' ? '生理期，需要更多关爱' : 
                             cycleStatus.color === 'green' ? `安全期，充满活力\n距上次亲密：${getDaysSinceLastSex()}` : 
                             cycleStatus.color === 'yellow' ? `黄体期，情绪或有波动\n距上次亲密：${getDaysSinceLastSex()}` : 
                             '状态未知'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 快捷按钮 - 仅在桌面端显示 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 hidden md:grid">
                  <button 
                    onClick={() => setShowSexModal(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl flex flex-col items-center"
                  >
                    <span className="text-2xl mb-1">🌸</span>
                    <span className="text-sm">生理</span>
                  </button>
                  <button 
                    onClick={() => setShowWishModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl flex flex-col items-center"
                  >
                    <span className="text-2xl mb-1">💰</span>
                    <span className="text-sm">消费</span>
                  </button>

                  <button 
                    onClick={() => setShowAddObservationModal(true)}
                    className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl flex flex-col items-center"
                  >
                    <span className="text-2xl mb-1">📝</span>
                    <span className="text-sm">记录</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* 右侧：纪念日和愿望单 - 只在桌面端显示 */}
          <div className="space-y-8 hidden md:block">
            {/* 纪念日 */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl border border-purple-800/50 p-6">
              <h3 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">最近纪念日</h3>
              
              {sortedAnniversaries.length > 0 ? (
                <div className="space-y-4">
                  {sortedAnniversaries.map((anniv, index) => (
                    <div key={index} className="bg-gray-800/80 rounded-lg p-4 border border-purple-700/30">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-white">{anniv.title}</h4>
                          <p className="text-gray-400 text-sm">{new Date(anniv.date).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full px-4 py-2 text-white font-bold">
                          {anniv.countdown}天
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">暂无纪念日</p>
              )}
            </div>
            
            {/* 愿望单 */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl border border-purple-800/50 p-6">
              <h3 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">愿望单</h3>
              
              {sortedWishlist.length > 0 ? (
                <div className="space-y-4">
                  {sortedWishlist.map((item, index) => (
                    <div key={index} className="bg-gray-800/80 rounded-lg p-4 border border-purple-700/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white">{item.name}</h4>
                          <p className="text-yellow-400 font-bold">¥{item.price.toFixed(2)}</p>
                          {item.notes && (
                            <p className="text-gray-400 text-sm mt-1">{item.notes}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.priority === '高' ? 'bg-red-500' : item.priority === '中' ? 'bg-yellow-500' : 'bg-green-500'}`}>
                          {item.priority}优先级
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">暂无愿望单项目</p>
              )}
            </div>
          </div>
        </div>
        

        
        {/* 底部区域：图片瀑布流 - 只在桌面端显示 */}
        {sfwImages.length > 0 && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl border border-purple-800/50 p-6 hidden md:block">
            <h3 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">图片画廊</h3>
            
            <div className="columns-2 md:columns-3 lg:columns-4 gap-6">
              {sfwImages.map((image, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg group relative hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all duration-500 border border-purple-700/30 mb-6 break-inside-avoid">
                  <div className="cursor-pointer overflow-hidden flex items-center justify-center">
                    <img 
                      src={image.url} 
                      alt={`Image ${index + 1}`}
                      className="max-w-full max-h-60 object-contain transition-all duration-500 ease-in-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-4 w-full">
                        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-green-500">
                          SFW
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      

      


    </Layout>
  );
};

export default Dashboard;