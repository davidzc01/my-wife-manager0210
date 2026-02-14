import React, { useState, useEffect } from 'react';
import { saveExpenseData, loadData } from '../services/storage';
import Layout from './Layout';

interface Expense {
  id: string;
  name: string;
  type: string;
  supplier: string;
  price: number;
  date: string;
  occasion: string;
  reaction: string;
  notes?: string;
}

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  link: string;
  priority: '低' | '中' | '高';
  notes?: string;
}

interface ExpenseData {
  expenses: Expense[];
  wishlist: WishlistItem[];
}

const ExpenseTracker: React.FC = () => {
  const [expenseData, setExpenseData] = useState<ExpenseData>({
    expenses: [],
    wishlist: [],
  });
  const [newExpense, setNewExpense] = useState<Expense>({
    id: '',
    name: '',
    type: '',
    supplier: '',
    price: 0,
    date: new Date().toISOString().split('T')[0],
    occasion: '',
    reaction: '',
    notes: '',
  });
  const [newWishlistItem, setNewWishlistItem] = useState<WishlistItem>({
    id: '',
    name: '',
    price: 0,
    link: '',
    priority: '中',
    notes: '',
  });
  const [error] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'expenses' | 'wishlist'>('expenses');
  const [timeDimension, setTimeDimension] = useState<'all' | 'year' | 'quarter' | 'month'>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedQuarter, setSelectedQuarter] = useState<string>('1');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<'expenses' | 'wishlist'>('expenses');
  const [editMode, setEditMode] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<string>('');
  const [satisfyingWishlistId, setSatisfyingWishlistId] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 从URL参数中读取默认tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'wishlist') {
      setActiveTab('wishlist');
    }
  }, []);

  // 加载消费数据
  useEffect(() => {
    const data = loadData();
    if (data && data.expenses) {
      setExpenseData(data.expenses);
    }
  }, []);

  // 处理消费记录变化
  const handleExpenseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setNewExpense(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  // 处理愿望单项目变化
  const handleWishlistChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setNewWishlistItem(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  // 处理愿望单优先级变化
  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setNewWishlistItem(prev => ({
      ...prev,
      priority: value as '低' | '中' | '高',
    }));
  };

  // 添加消费记录
  const addExpense = () => {
    const expense: Expense = {
      ...newExpense,
      id: Date.now().toString(),
    };

    const updatedExpenses = [...expenseData.expenses, expense];
    setExpenseData(prev => ({
      ...prev,
      expenses: updatedExpenses,
    }));
    saveExpenseData({ ...expenseData, expenses: updatedExpenses });
    setSuccess('消费记录已添加！');
    setNewExpense({
      id: '',
      name: '',
      type: '',
      supplier: '',
      price: 0,
      date: new Date().toISOString().split('T')[0],
      occasion: '',
      reaction: '',
      notes: '',
    });
  };

  // 删除消费记录
  const deleteExpense = (id: string) => {
    const updatedExpenses = expenseData.expenses.filter(expense => expense.id !== id);
    setExpenseData(prev => ({
      ...prev,
      expenses: updatedExpenses,
    }));
    saveExpenseData({ ...expenseData, expenses: updatedExpenses });
    setSuccess('消费记录已删除！');
  };

  // 添加愿望单项目
  const addWishlistItem = () => {
    const item: WishlistItem = {
      ...newWishlistItem,
      id: Date.now().toString(),
    };

    const updatedWishlist = [...expenseData.wishlist, item];
    setExpenseData(prev => ({
      ...prev,
      wishlist: updatedWishlist,
    }));
    saveExpenseData({ ...expenseData, wishlist: updatedWishlist });
    setSuccess('愿望单项目已添加！');
    setNewWishlistItem({
      id: '',
      name: '',
      price: 0,
      link: '',
      priority: '中',
      notes: '',
    });
  };

  // 删除愿望单项目
  const deleteWishlistItem = (id: string) => {
    const updatedWishlist = expenseData.wishlist.filter(item => item.id !== id);
    setExpenseData(prev => ({
      ...prev,
      wishlist: updatedWishlist,
    }));
    saveExpenseData({ ...expenseData, wishlist: updatedWishlist });
    setSuccess('愿望单项目已删除！');
  };

  // 编辑消费记录
  const editExpense = (id: string) => {
    const expenseToEdit = expenseData.expenses.find(expense => expense.id === id);
    if (expenseToEdit) {
      setNewExpense(expenseToEdit);
      setCurrentEditId(id);
      setEditMode(true);
      setModalActiveTab('expenses');
      setShowExpenseModal(true);
    }
  };

  // 编辑愿望单项目
  const editWishlistItem = (id: string) => {
    const itemToEdit = expenseData.wishlist.find(item => item.id === id);
    if (itemToEdit) {
      setNewWishlistItem(itemToEdit);
      setCurrentEditId(id);
      setEditMode(true);
      setModalActiveTab('wishlist');
      setShowExpenseModal(true);
    }
  };

  // 已满足愿望单项目
  const markAsSatisfied = (id: string) => {
    const itemToSatisfy = expenseData.wishlist.find(item => item.id === id);
    if (itemToSatisfy) {
      // 创建对应的消费记录
      const newExpenseRecord: Expense = {
        id: Date.now().toString(),
        name: itemToSatisfy.name,
        type: '',
        supplier: '',
        price: itemToSatisfy.price,
        date: new Date().toISOString().split('T')[0],
        occasion: '',
        reaction: '',
        notes: itemToSatisfy.notes,
      };

      // 打开消费弹窗，让用户编辑生成的消费记录
      setNewExpense(newExpenseRecord);
      setCurrentEditId(newExpenseRecord.id);
      setEditMode(true);
      setModalActiveTab('expenses');
      setSatisfyingWishlistId(id);
      setShowExpenseModal(true);
    }
  };

  // 保存编辑
  const saveEdit = () => {
    if (editMode) {
      if (modalActiveTab === 'expenses') {
        // 编辑消费记录
        let updatedExpenses;
        let updatedWishlist = expenseData.wishlist;
        
        // 检查是否是新的消费记录（从愿望单转换）
        const isNewExpense = !expenseData.expenses.some(expense => expense.id === currentEditId);
        
        if (isNewExpense) {
          // 添加新的消费记录
          updatedExpenses = [...expenseData.expenses, newExpense];
          
          // 如果是从愿望单转换过来的，从愿望单中移除该项目
          if (satisfyingWishlistId) {
            updatedWishlist = expenseData.wishlist.filter(item => item.id !== satisfyingWishlistId);
            setSuccess('愿望单项目已标记为已满足！');
          } else {
            setSuccess('消费记录已添加！');
          }
        } else {
          // 更新现有消费记录
          updatedExpenses = expenseData.expenses.map(expense => 
            expense.id === currentEditId ? newExpense : expense
          );
          setSuccess('消费记录已更新！');
        }
        
        setExpenseData(prev => ({
          ...prev,
          expenses: updatedExpenses,
          wishlist: updatedWishlist,
        }));
        saveExpenseData({ ...expenseData, expenses: updatedExpenses, wishlist: updatedWishlist });
      } else {
        // 编辑愿望单项目
        const updatedWishlist = expenseData.wishlist.map(item => 
          item.id === currentEditId ? newWishlistItem : item
        );
        setExpenseData(prev => ({
          ...prev,
          wishlist: updatedWishlist,
        }));
        saveExpenseData({ ...expenseData, wishlist: updatedWishlist });
        setSuccess('愿望单项目已更新！');
      }
      
      // 重置编辑模式
      setEditMode(false);
      setCurrentEditId('');
      setSatisfyingWishlistId('');
    } else {
      // 正常保存
      if (modalActiveTab === 'expenses') {
        addExpense();
      } else {
        addWishlistItem();
      }
    }
  };

  // 过滤消费记录
  const getFilteredExpenses = () => {
    return expenseData.expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const expenseYear = expenseDate.getFullYear().toString();
      const expenseQuarter = Math.floor(expenseDate.getMonth() / 3) + 1;
      const expenseMonth = expenseDate.getMonth().toString();

      // 时间维度过滤
      if (timeDimension === 'year' && expenseYear !== selectedYear) return false;
      if (timeDimension === 'quarter' && (expenseYear !== selectedYear || expenseQuarter !== parseInt(selectedQuarter))) return false;
      if (timeDimension === 'month' && (expenseYear !== selectedYear || expenseMonth !== selectedMonth)) return false;

      // 关键词搜索
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        return (
          expense.name.toLowerCase().includes(keyword) ||
          expense.type.toLowerCase().includes(keyword) ||
          expense.supplier.toLowerCase().includes(keyword) ||
          expense.occasion.toLowerCase().includes(keyword) ||
          expense.reaction.toLowerCase().includes(keyword) ||
          (expense.notes && expense.notes.toLowerCase().includes(keyword))
        );
      }

      return true;
    });
  };

  // 获取排序后的消费记录
  const getSortedExpenses = () => {
    return [...getFilteredExpenses()].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' ? b.price - a.price : a.price - b.price;
      }
    });
  };

  // 计算总消费
  const calculateTotalExpense = () => {
    return getFilteredExpenses().reduce((total, expense) => total + expense.price, 0);
  };



  return (
    <Layout>
      <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-8">
        <h2 className="text-3xl font-bold mb-8 text-center text-blue-400">消费记录</h2>

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

        {/* 标签切换 */}
        <div className="mb-8 border-b border-gray-700">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-t-lg transition duration-300 ease-in-out ${
                activeTab === 'expenses' ? 'bg-gray-700 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              消费记录
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`px-4 py-2 rounded-t-lg transition duration-300 ease-in-out ${
                activeTab === 'wishlist' ? 'bg-gray-700 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              愿望单
            </button>
          </div>
        </div>

        {/* 消费记录 */}
        {activeTab === 'expenses' && (
          <>
            {/* 消费统计 */}
            <div className="mb-8 bg-gray-700 rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
                <h3 className="text-xl font-bold text-purple-300">消费统计</h3>
                <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">时间维度</label>
                    <select
                      className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={timeDimension}
                      onChange={(e) => setTimeDimension(e.target.value as 'all' | 'year' | 'quarter' | 'month')}
                    >
                      <option value="all">全部</option>
                      <option value="year">年</option>
                      <option value="quarter">季度</option>
                      <option value="month">月</option>
                    </select>
                  </div>
                  {timeDimension !== 'all' && (
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">年份</label>
                      <select
                        className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                      >
                        {[...Array(5)].map((_, i) => {
                          const year = new Date().getFullYear() - i;
                          return <option key={year} value={year}>{year}</option>;
                        })}
                      </select>
                    </div>
                  )}
                  {timeDimension === 'quarter' && (
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">季度</label>
                      <select
                        className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedQuarter}
                        onChange={(e) => setSelectedQuarter(e.target.value)}
                      >
                        {[1, 2, 3, 4].map(quarter => (
                          <option key={quarter} value={quarter}>{quarter}季度</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {timeDimension === 'month' && (
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">月份</label>
                      <select
                        className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                      >
                        {[...Array(12)].map((_, i) => {
                          const month = i + 1;
                          return <option key={i} value={i}>{month}月</option>;
                        })}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-gray-400 mb-2">总消费次数</h4>
                  <p className="text-3xl font-bold">{getFilteredExpenses().length}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-gray-400 mb-2">总消费金额</h4>
                  <p className="text-3xl font-bold">¥{calculateTotalExpense().toFixed(2)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-gray-400 mb-2">平均每次消费</h4>
                  <p className="text-3xl font-bold">¥{getFilteredExpenses().length > 0 ? (calculateTotalExpense() / getFilteredExpenses().length).toFixed(2) : '0.00'}</p>
                </div>
              </div>
            </div>

            {/* 添加消费记录按钮 */}
            <div className="mb-12">
              <button
                onClick={() => setShowExpenseModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 ease-in-out shadow-lg"
              >
                + 添加消费记录
              </button>
            </div>

            {/* 消费记录列表 */}
            <div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
                <h3 className="text-xl font-bold text-purple-300">消费记录列表</h3>
                <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="搜索关键词..."
                        className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'date' | 'price')}
                    >
                      <option value="date">日期</option>
                      <option value="price">金额</option>
                    </select>
                    <select
                      className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    >
                      <option value="desc">降序</option>
                      <option value="asc">升序</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-6">
                {getFilteredExpenses().length === 0 ? (
                  <p className="text-gray-400 text-center py-8">暂无消费记录</p>
                ) : (
                  <div className="space-y-4">
                    {getSortedExpenses().map((expense) => (
                      <div key={expense.id} className="bg-gray-800 rounded-lg p-4 flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="md:w-2/3 space-y-2">
                          <div className="flex items-center space-x-4">
                            <span className="text-blue-300 font-bold">{expense.date}</span>
                            <span className="text-xl font-bold">{expense.name}</span>
                            <span className="text-yellow-400 font-bold">¥{expense.price.toFixed(2)}</span>
                          </div>
                          <div className="flex flex-wrap gap-4">
                            <span className="text-gray-400">类型: {expense.type}</span>
                            <span className="text-gray-400">供应商: {expense.supplier}</span>
                            <span className="text-gray-400">事由: {expense.occasion}</span>
                            <span className="text-gray-400">反应: {expense.reaction}</span>
                          </div>
                          {expense.notes && (
                            <p className="text-gray-400 text-sm mt-1">{expense.notes}</p>
                          )}
                        </div>
                        <div className="md:w-1/3 flex justify-end gap-3 mt-4 md:mt-0">
                          <button
                            onClick={() => editExpense(expense.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300 ease-in-out"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => deleteExpense(expense.id)}
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
          </>
        )}

        {/* 愿望单 */}
        {activeTab === 'wishlist' && (
          <>
            {/* 愿望单统计 */}
            <div className="mb-8 bg-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-purple-300">愿望单统计</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-gray-400 mb-2">已满足数量</h4>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-gray-400 mb-2">待满足数量</h4>
                  <p className="text-3xl font-bold">{expenseData.wishlist.length}</p>
                </div>
              </div>
            </div>

            {/* 添加愿望单项目 */}
            <div className="mb-12">
              <button
                onClick={() => {
                  setModalActiveTab('wishlist');
                  setShowExpenseModal(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 ease-in-out shadow-lg"
              >
                + 添加愿望单项目
              </button>
            </div>

            {/* 愿望单列表 */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-purple-300">愿望单列表</h3>
              <div className="bg-gray-700 rounded-lg p-6">
                {expenseData.wishlist.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">暂无愿望单项目</p>
                ) : (
                  <div className="space-y-4">
                    {[...expenseData.wishlist]
                      .sort((a, b) => {
                        const priorityOrder = { '高': 0, '中': 1, '低': 2 };
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                      })
                      .map((item) => (
                        <div key={item.id} className="bg-gray-800 rounded-lg p-4 flex flex-col md:flex-row md:justify-between md:items-center">
                          <div className="md:w-2/3 space-y-2">
                            <div className="flex items-center space-x-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                item.priority === '高' ? 'bg-red-600' :
                                item.priority === '中' ? 'bg-yellow-600' :
                                'bg-green-600'
                              }`}>
                                {item.priority}优先级
                              </span>
                              <span className="text-xl font-bold">{item.name}</span>
                              <span className="text-yellow-400 font-bold">¥{item.price.toFixed(2)}</span>
                            </div>
                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline break-all"
                              >
                                {item.link}
                              </a>
                            )}
                            {item.notes && (
                              <p className="text-gray-400 text-sm mt-1">{item.notes}</p>
                            )}
                          </div>
                          <div className="md:w-1/3 flex justify-end gap-3 mt-4 md:mt-0">
                            <button
                              onClick={() => markAsSatisfied(item.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-300 ease-in-out"
                            >
                              已满足
                            </button>
                            <button
                              onClick={() => editWishlistItem(item.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300 ease-in-out"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => deleteWishlistItem(item.id)}
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
          </>
        )}

        {/* 消费弹窗 */}
        {showExpenseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-500 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-purple-800 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-600">消费</h3>
              <div className="flex space-x-4 mb-8">
                <button 
                  onClick={() => setModalActiveTab('wishlist')}
                  className={`flex-1 py-3 px-4 rounded-lg transition-all duration-300 ${modalActiveTab === 'wishlist' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  愿望单
                </button>
                <button 
                  onClick={() => setModalActiveTab('expenses')}
                  className={`flex-1 py-3 px-4 rounded-lg transition-all duration-300 ${modalActiveTab === 'expenses' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  消费记录
                </button>
              </div>
              
              {/* 愿望单表单 */}
              {modalActiveTab === 'wishlist' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">物品名称</h4>
                    <input
                      type="text"
                      id="wishlistName"
                      name="name"
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newWishlistItem.name}
                      onChange={handleWishlistChange}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">价格 (¥)</h4>
                    <input
                      type="number"
                      id="wishlistPrice"
                      name="price"
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newWishlistItem.price}
                      onChange={handleWishlistChange}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">链接</h4>
                    <input
                      type="url"
                      id="link"
                      name="link"
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newWishlistItem.link}
                      onChange={handleWishlistChange}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">优先级</h4>
                    <select
                      id="priority"
                      name="priority"
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newWishlistItem.priority}
                      onChange={handlePriorityChange}
                    >
                      <option value="低">低</option>
                      <option value="中">中</option>
                      <option value="高">高</option>
                    </select>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">备注</h4>
                    <textarea
                      id="wishlistNotes"
                      name="notes"
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newWishlistItem.notes}
                      onChange={handleWishlistChange}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button 
                      onClick={() => {
                        setShowExpenseModal(false);
                        setSatisfyingWishlistId('');
                        setEditMode(false);
                        setCurrentEditId('');
                      }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
                    >
                      取消
                    </button>
                    <button 
                      onClick={() => {
                        saveEdit();
                        setShowExpenseModal(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
                    >
                      {editMode ? '更新' : '保存'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* 消费记录表单 */}
              {modalActiveTab === 'expenses' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">礼物名称</h4>
                    <input 
                      placeholder="例如：口红、包包、香水等" 
                      className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                      type="text" 
                      name="name"
                      value={newExpense.name}
                      onChange={handleExpenseChange}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">类型</h4>
                    <input 
                      placeholder="例如：化妆品、配饰、电子产品等" 
                      className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                      type="text" 
                      name="type"
                      value={newExpense.type}
                      onChange={handleExpenseChange}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">供应商</h4>
                    <input 
                      placeholder="例如：天猫、京东、专柜等" 
                      className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                      type="text" 
                      name="supplier"
                      value={newExpense.supplier}
                      onChange={handleExpenseChange}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">价格 (¥)</h4>
                    <input 
                      placeholder="0.00" 
                      className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                      type="number" 
                      name="price"
                      value={newExpense.price}
                      onChange={handleExpenseChange}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">日期</h4>
                    <input 
                      className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                      type="date" 
                      name="date"
                      value={newExpense.date}
                      onChange={handleExpenseChange}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">事由</h4>
                    <input 
                      placeholder="例如：生日、情人节、纪念日等" 
                      className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                      type="text" 
                      name="occasion"
                      value={newExpense.occasion}
                      onChange={handleExpenseChange}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">反应</h4>
                    <input 
                      placeholder="例如：很高兴、很喜欢、非常惊喜等" 
                      className="w-full px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                      type="text" 
                      name="reaction"
                      value={newExpense.reaction}
                      onChange={handleExpenseChange}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">备注</h4>
                    <textarea 
                      placeholder="例如：她打开礼物时的表情非常可爱，说这是她收到的最好的礼物之一" 
                      className="w-full h-24 px-4 py-3 rounded-lg border border-purple-700/50 bg-gray-800/80 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none" 
                      name="notes"
                      value={newExpense.notes}
                      onChange={handleExpenseChange}
                    />
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button 
                      onClick={() => {
                        setShowExpenseModal(false);
                        setSatisfyingWishlistId('');
                        setEditMode(false);
                        setCurrentEditId('');
                      }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
                    >
                      取消
                    </button>
                    <button 
                      onClick={() => {
                        saveEdit();
                        setShowExpenseModal(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out"
                    >
                      {editMode ? '更新' : '保存'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExpenseTracker;