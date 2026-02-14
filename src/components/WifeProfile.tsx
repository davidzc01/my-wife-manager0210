import React, { useState, useEffect } from 'react';
import { saveWifeData, saveCycleData, loadData, saveImages } from '../services/storage';
import Layout from './Layout';

interface Anniversary {
  date: string;
  title: string;
  description?: string;
}

interface SexRecord {
  id: string;
  date: string;
  location?: string;
  position?: string;
  ejaculation: boolean;
  ejaculationLocation?: string;
  notes?: string;
}

interface CycleData {
  lastPeriodStart: string;
  cycleLength: number;
  periodLength: number;
  sexRecords: SexRecord[];
}

interface Image {
  id: string;
  url: string;
  type: 'SFW' | 'NSFW';
  uploadedAt: string;
  description?: string;
}

interface WifeData {
  name: string;
  birthday: string;
  height?: number;
  weight?: number;
  shoeSize?: number;
  bloodType?: string;
  mbti?: string;
  measurements?: {
    bust: number;
    waist: number;
    hips: number;
  };
  avatar: string;
  anniversaries: Anniversary[];
}

const WifeProfile: React.FC = () => {
  const [wifeData, setWifeData] = useState<WifeData>({
    name: '',
    birthday: '',
    height: undefined,
    weight: undefined,
    shoeSize: undefined,
    bloodType: '',
    mbti: '',
    measurements: {
      bust: 0,
      waist: 0,
      hips: 0,
    },
    avatar: '',
    anniversaries: [],
  });
  const [newAnniversary, setNewAnniversary] = useState<Anniversary>({
    date: '',
    title: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [age, setAge] = useState(0);
  const [bmi, setBmi] = useState(0);
  const [zodiac, setZodiac] = useState('');
  
  // 生理周期相关状态
  const [cycleData, setCycleData] = useState<CycleData>({
    lastPeriodStart: '',
    cycleLength: 28,
    periodLength: 5,
    sexRecords: [],
  });
  const [newSexRecord, setNewSexRecord] = useState<SexRecord>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    position: '',
    ejaculation: false,
    ejaculationLocation: '',
    notes: '',
  });
  const [, setCycleStatus] = useState({
    currentDay: 0,
    status: '未知',
    statusColor: 'gray',
    nextPeriod: '',
    fertileWindow: [] as string[],
    pregnancyRisk: '低',
  });

  // 加载老婆数据
  useEffect(() => {
    const data = loadData();
    if (data && data.wife) {
      setWifeData(data.wife);
    }
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
        fertileWindow: [fertileWindowStart.toLocaleDateString(), fertileWindowEnd.toLocaleDateString()],
        pregnancyRisk,
      });
    }
  }, [cycleData]);

  // 根据生日计算星座
  const calculateZodiac = (birthday: string) => {
    const birthDate = new Date(birthday);
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();

    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
      return '水瓶座';
    } else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
      return '双鱼座';
    } else if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
      return '白羊座';
    } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
      return '金牛座';
    } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
      return '双子座';
    } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
      return '巨蟹座';
    } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
      return '狮子座';
    } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
      return '处女座';
    } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
      return '天秤座';
    } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
      return '天蝎座';
    } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
      return '射手座';
    } else {
      return '摩羯座';
    }
  };

  // 计算年龄、BMI和星座
  useEffect(() => {
    if (wifeData.birthday) {
      const today = new Date();
      const birthDate = new Date(wifeData.birthday);
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
      
      // 计算星座
      const calculatedZodiac = calculateZodiac(wifeData.birthday);
      setZodiac(calculatedZodiac);
    }

    if (wifeData.height && wifeData.weight) {
      const heightInMeters = wifeData.height / 100;
      const calculatedBmi = wifeData.weight / (heightInMeters * heightInMeters);
      setBmi(parseFloat(calculatedBmi.toFixed(2)));
    }
  }, [wifeData.birthday, wifeData.height, wifeData.weight]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('measurements.')) {
      const measurementType = name.split('.')[1];
      setWifeData(prev => ({
        ...prev,
        measurements: {
          ...prev.measurements!,
          [measurementType]: parseFloat(value) || 0,
        },
      }));
    } else if (name === 'height' || name === 'weight' || name === 'shoeSize') {
      setWifeData(prev => ({
        ...prev,
        [name]: parseFloat(value) || undefined,
      }));
    } else {
      setWifeData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setWifeData(prev => ({
            ...prev,
            avatar: event.target?.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnniversaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAnniversary(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const addAnniversary = () => {
    if (!newAnniversary.date || !newAnniversary.title) {
      setError('请填写纪念日日期和标题');
      return;
    }

    setWifeData(prev => ({
      ...prev,
      anniversaries: [...prev.anniversaries, newAnniversary],
    }));

    setNewAnniversary({ date: '', title: '', description: '' });
    setSuccess('纪念日添加成功！');
  };

  const removeAnniversary = (index: number) => {
    setWifeData(prev => ({
      ...prev,
      anniversaries: prev.anniversaries.filter((_, i) => i !== index),
    }));
    setSuccess('纪念日删除成功！');
  };

  // 处理周期数据变化
  const handleCycleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCycleData(prev => ({
      ...prev,
      [name]: name === 'cycleLength' || name === 'periodLength' ? parseInt(value) : value,
    }));
  };

  // 处理做爱记录变化
  const handleSexRecordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setNewSexRecord(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 保存周期数据
  const saveCycleSettings = () => {
    saveCycleData(cycleData);
    setSuccess('周期设置已保存！');
  };

  // 添加做爱记录
  const addSexRecord = () => {
    const record: SexRecord = {
      ...newSexRecord,
      id: Date.now().toString(),
    };

    const updatedRecords = [...cycleData.sexRecords, record];
    setCycleData(prev => ({
      ...prev,
      sexRecords: updatedRecords,
    }));
    saveCycleData({ ...cycleData, sexRecords: updatedRecords });
    setSuccess('做爱记录已添加！');
    setNewSexRecord({
      id: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      position: '',
      ejaculation: false,
      ejaculationLocation: '',
      notes: '',
    });
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 验证必填字段
    if (!wifeData.name || !wifeData.birthday || !wifeData.avatar) {
      setError('请填写必填字段（姓名、生日、照片）');
      return;
    }

    // 自动将生日添加为纪念日（如果尚未添加）
    const hasBirthdayAnniversary = wifeData.anniversaries.some(anniversary => 
      anniversary.title.includes('生日') && anniversary.date === wifeData.birthday
    );

    let updatedWifeData = { ...wifeData };
    if (!hasBirthdayAnniversary) {
      updatedWifeData = {
        ...wifeData,
        anniversaries: [
          ...wifeData.anniversaries,
          {
            date: wifeData.birthday,
            title: `${wifeData.name}的生日`,
            description: `${wifeData.name}的生日纪念日`
          }
        ]
      };
    }

    // 将老婆图片添加到画廊
    const data = loadData();
    const existingImages = data?.images || [];
    
    // 检查图片是否已经存在于画廊中
    const avatarExists = existingImages.some((img: Image) => img.url === wifeData.avatar);
    
    if (!avatarExists) {
      const newImage: Image = {
        id: Date.now().toString(),
        url: wifeData.avatar,
        type: 'SFW', // 老婆头像默认为SFW
        uploadedAt: new Date().toISOString(),
        description: `${wifeData.name}的头像`
      };
      
      const updatedImages = [...existingImages, newImage];
      
      // 保存图片到存储
      saveImages(updatedImages);
    }

    // 保存生理周期数据
    saveCycleSettings();
    if (newSexRecord.date) {
      addSexRecord();
    }

    // 保存老婆数据
    saveWifeData(updatedWifeData);
    setSuccess('老婆档案更新成功！');
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl border border-purple-800 p-8">
        <h2 className="text-4xl font-bold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">老婆档案</h2>

        {error && (
          <div className="bg-red-900/50 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-6 shadow-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-600 text-green-400 px-4 py-3 rounded-lg mb-6 shadow-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
            {/* 照片上传 */}
            <div className="flex flex-col items-center">
              <label htmlFor="avatar" className="block text-pink-300 text-sm font-bold mb-4">
                照片（必填）
              </label>
              <div className="flex items-center justify-center w-full max-w-xs">
                <label className="flex flex-col items-center justify-center w-full h-72 border-2 border-pink-500/50 border-dashed rounded-xl cursor-pointer bg-gray-800/80 hover:bg-gray-700/80 transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {wifeData.avatar ? (
                      <img 
                        src={wifeData.avatar} 
                        alt="Wife Avatar" 
                        className="w-64 h-64 rounded-xl object-cover shadow-lg transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <>
                        <svg className="w-24 h-24 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-pink-300 mt-3">点击上传照片</p>
                        <p className="text-xs text-pink-200/70 mt-1">支持JPG、PNG格式</p>
                      </>
                    )}
                  </div>
                  <input id="avatar" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>

              {/* 自动计算信息 */}
              <div className="mt-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 w-full max-w-xs shadow-lg border border-purple-700/50">
                <h3 className="text-xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">基本信息</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-pink-300">年龄:</span>
                    <span className="font-bold text-white text-lg">{age}岁</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-pink-300">BMI:</span>
                    <span className="font-bold text-white text-lg">{bmi.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-pink-300">BMI 分类:</span>
                    <span className="font-bold text-white text-lg">
                      {bmi < 18.5 ? '偏瘦' :
                       bmi < 24 ? '正常' :
                       bmi < 28 ? '超重' : '肥胖'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-pink-300">星座:</span>
                    <span className="font-bold text-white text-lg">{zodiac || '未设置'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 个人信息 */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 shadow-lg border border-purple-800/50">
              <h3 className="text-2xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">个人信息</h3>
              
              <div className="space-y-6">
                {/* 姓名和生日 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label htmlFor="name" className="block text-pink-300 text-sm font-bold">
                      姓名 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300 hover:border-purple-500/70"
                      value={wifeData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label htmlFor="birthday" className="block text-pink-300 text-sm font-bold">
                      生日 *
                    </label>
                    <input
                      type="date"
                      id="birthday"
                      name="birthday"
                      className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300 hover:border-purple-500/70"
                      value={wifeData.birthday}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* 身高、体重、鞋码、血型 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-3">
                    <label htmlFor="height" className="block text-pink-300 text-sm font-bold">
                      身高 (cm)
                    </label>
                    <input
                      type="number"
                      id="height"
                      name="height"
                      className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300 hover:border-purple-500/70"
                      value={wifeData.height || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label htmlFor="weight" className="block text-pink-300 text-sm font-bold">
                      体重 (kg)
                    </label>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300 hover:border-purple-500/70"
                      value={wifeData.weight || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label htmlFor="shoeSize" className="block text-pink-300 text-sm font-bold">
                      鞋码
                    </label>
                    <input
                      type="number"
                      id="shoeSize"
                      name="shoeSize"
                      className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300 hover:border-purple-500/70"
                      value={wifeData.shoeSize || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label htmlFor="bloodType" className="block text-pink-300 text-sm font-bold">
                      血型
                    </label>
                    <select
                      id="bloodType"
                      name="bloodType"
                      className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300 hover:border-purple-500/70"
                      value={wifeData.bloodType}
                      onChange={handleChange}
                    >
                      <option value="">请选择</option>
                      <option value="A">A型</option>
                      <option value="B">B型</option>
                      <option value="AB">AB型</option>
                      <option value="O">O型</option>
                    </select>
                  </div>
                </div>

                {/* MBTI */}
                <div className="space-y-3">
                  <label htmlFor="mbti" className="block text-pink-300 text-sm font-bold">
                    MBTI
                  </label>
                  <select
                    id="mbti"
                    name="mbti"
                    className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300 hover:border-purple-500/70"
                    value={wifeData.mbti}
                    onChange={handleChange}
                  >
                    <option value="">请选择</option>
                    <option value="INTJ">INTJ - 建筑师</option>
                    <option value="INTP">INTP - 逻辑学家</option>
                    <option value="ENTJ">ENTJ - 指挥官</option>
                    <option value="ENTP">ENTP - 辩论家</option>
                    <option value="INFJ">INFJ - 提倡者</option>
                    <option value="INFP">INFP - 调停者</option>
                    <option value="ENFJ">ENFJ - 主人公</option>
                    <option value="ENFP">ENFP - 竞选者</option>
                    <option value="ISTJ">ISTJ -  logistician</option>
                    <option value="ISFJ">ISFJ - 守卫者</option>
                    <option value="ESTJ">ESTJ - 总经理</option>
                    <option value="ESFJ">ESFJ - 执政官</option>
                    <option value="ISTP">ISTP - 鉴赏家</option>
                    <option value="ISFP">ISFP - 探险家</option>
                    <option value="ESTP">ESTP - 企业家</option>
                    <option value="ESFP">ESFP - 表演者</option>
                  </select>
                </div>

                {/* 三维信息 */}
                <div className="space-y-3">
                  <label className="block text-pink-300 text-sm font-bold">
                    三维 (cm)
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-800/80 rounded-lg p-4 border border-purple-700/50 shadow-lg hover:border-purple-500/70 transition-all duration-300">
                      <label htmlFor="measurements.bust" className="block text-pink-400 text-xs font-bold mb-2">
                        胸围
                      </label>
                      <input
                        type="number"
                        id="measurements.bust"
                        name="measurements.bust"
                        className="w-full px-4 py-3 rounded-lg border border-purple-600/50 bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 hover:border-purple-500/70"
                        value={wifeData.measurements?.bust || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="bg-gray-800/80 rounded-lg p-4 border border-purple-700/50 shadow-lg hover:border-purple-500/70 transition-all duration-300">
                      <label htmlFor="measurements.waist" className="block text-pink-400 text-xs font-bold mb-2">
                        腰围
                      </label>
                      <input
                        type="number"
                        id="measurements.waist"
                        name="measurements.waist"
                        className="w-full px-4 py-3 rounded-lg border border-purple-600/50 bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 hover:border-purple-500/70"
                        value={wifeData.measurements?.waist || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="bg-gray-800/80 rounded-lg p-4 border border-purple-700/50 shadow-lg hover:border-purple-500/70 transition-all duration-300">
                      <label htmlFor="measurements.hips" className="block text-pink-400 text-xs font-bold mb-2">
                        臀围
                      </label>
                      <input
                        type="number"
                        id="measurements.hips"
                        name="measurements.hips"
                        className="w-full px-4 py-3 rounded-lg border border-purple-600/50 bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 hover:border-purple-500/70"
                        value={wifeData.measurements?.hips || ''}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
          </div>
          </div>

          {/* 纪念日 */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">纪念日</h3>
            
            {/* 添加纪念日 */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 mb-8 shadow-lg border border-purple-800/50">
              <h4 className="text-xl font-bold mb-6 text-pink-300">添加纪念日</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="anniversaryDate" className="block text-pink-300 text-sm font-bold mb-3">
                    日期
                  </label>
                  <input
                    type="date"
                    id="anniversaryDate"
                    name="date"
                    className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300"
                    value={newAnniversary.date}
                    onChange={handleAnniversaryChange}
                  />
                </div>
                <div>
                  <label htmlFor="anniversaryTitle" className="block text-pink-300 text-sm font-bold mb-3">
                    标题
                  </label>
                  <input
                    type="text"
                    id="anniversaryTitle"
                    name="title"
                    className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300"
                    value={newAnniversary.title}
                    onChange={handleAnniversaryChange}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addAnniversary}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] transform hover:scale-105"
                  >
                    添加
                  </button>
                </div>
              </div>
              <div className="mt-6">
                <label htmlFor="anniversaryDescription" className="block text-pink-300 text-sm font-bold mb-3">
                  描述（可选）
                </label>
                <input
                  type="text"
                  id="anniversaryDescription"
                  name="description"
                  className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300"
                  value={newAnniversary.description || ''}
                  onChange={handleAnniversaryChange}
                />
              </div>
            </div>

            {/* 纪念日列表 */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 shadow-lg border border-purple-800/50">
              <h4 className="text-xl font-bold mb-6 text-pink-300">纪念日列表</h4>
              {wifeData.anniversaries.length === 0 ? (
                <p className="text-gray-400 text-center py-12 text-lg">暂无纪念日，请添加</p>
              ) : (
                <div className="space-y-5">
                  {wifeData.anniversaries.map((anniversary, index) => (
                    <div key={index} className="bg-gray-700/40 rounded-lg p-6 flex justify-between items-center shadow-md hover:shadow-lg transition-all duration-300 border border-purple-700/30">
                      <div>
                        <div className="flex items-center space-x-6">
                          <span className="text-pink-400 font-bold text-lg">{new Date(anniversary.date).toLocaleDateString()}</span>
                          <span className="font-bold text-white text-lg">{anniversary.title}</span>
                        </div>
                        {anniversary.description && (
                          <p className="text-gray-300 mt-2">{anniversary.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAnniversary(index)}
                        className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all duration-300 ease-in-out shadow-md hover:shadow-lg"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 生理周期 */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">生理周期</h3>
            
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 shadow-lg border border-purple-800/50">
              <h4 className="text-xl font-bold mb-6 text-pink-300">周期设置</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label htmlFor="lastPeriodStart" className="block text-pink-300 text-sm font-bold mb-3">
                    上次经期开始日期
                  </label>
                  <input
                    type="date"
                    id="lastPeriodStart"
                    name="lastPeriodStart"
                    className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300"
                    value={cycleData.lastPeriodStart}
                    onChange={handleCycleChange}
                  />
                </div>
                <div>
                  <label htmlFor="cycleLength" className="block text-pink-300 text-sm font-bold mb-3">
                    周期长度 (天)
                  </label>
                  <input
                    type="number"
                    id="cycleLength"
                    name="cycleLength"
                    className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300"
                    value={cycleData.cycleLength}
                    onChange={handleCycleChange}
                    min="21"
                    max="45"
                  />
                </div>
                <div>
                  <label htmlFor="periodLength" className="block text-pink-300 text-sm font-bold mb-3">
                    经期长度 (天)
                  </label>
                  <input
                    type="number"
                    id="periodLength"
                    name="periodLength"
                    className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300"
                    value={cycleData.periodLength}
                    onChange={handleCycleChange}
                    min="2"
                    max="7"
                  />
                </div>
              </div>
              
              <div className="mt-10">
                <h4 className="text-xl font-bold mb-6 text-pink-300">上一次做爱时间</h4>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                  <div>
                    <label htmlFor="sexDate" className="block text-pink-300 text-sm font-bold mb-3">
                      日期
                    </label>
                    <input
                      type="date"
                      id="sexDate"
                      name="date"
                      className="w-full px-5 py-4 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-lg transition-all duration-300"
                      value={newSexRecord.date}
                      onChange={handleSexRecordChange}
                    />
                  </div>
                </div>
              </div>
              

            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-10 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transform hover:scale-105"
            >
              保存老婆档案
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default WifeProfile;