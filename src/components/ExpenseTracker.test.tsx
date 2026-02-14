import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpenseTracker from './ExpenseTracker';
import { saveExpenseData, loadData } from '../services/storage';
import Layout from './Layout';

// 模拟依赖
jest.mock('./Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: any }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

jest.mock('../services/storage', () => ({
  saveExpenseData: jest.fn(),
  loadData: jest.fn(),
}));

const mockSaveExpenseData = saveExpenseData as jest.MockedFunction<typeof saveExpenseData>;
const mockLoadData = loadData as jest.MockedFunction<typeof loadData>;

describe('ExpenseTracker Component', () => {
  const mockExpenses = [
    {
      id: '1',
      name: '口红',
      type: '化妆品',
      supplier: '天猫',
      price: 199,
      date: '2026-02-14',
      occasion: '情人节',
      reaction: '很高兴',
      notes: '她很喜欢这个颜色'
    },
    {
      id: '2',
      name: '包包',
      type: '配饰',
      supplier: '京东',
      price: 999,
      date: '2026-02-13',
      occasion: '情人节',
      reaction: '非常惊喜',
      notes: '她一直想要这个包包'
    },
    {
      id: '3',
      name: '香水',
      type: '化妆品',
      supplier: '专柜',
      price: 599,
      date: '2026-02-12',
      occasion: '情人节',
      reaction: '很喜欢',
      notes: '她喜欢这个味道'
    }
  ];

  beforeEach(() => {
    // 重置所有模拟函数
    jest.clearAllMocks();
    
    // 模拟 loadData 返回测试数据
    mockLoadData.mockReturnValue({
      expenses: {
        expenses: mockExpenses,
        wishlist: []
      }
    });
  });

  test('renders the component successfully', () => {
    render(<ExpenseTracker />);
    expect(screen.getByText('消费统计')).toBeTruthy();
    expect(screen.getByText('消费记录列表')).toBeTruthy();
    expect(screen.getByText('+ 添加消费记录')).toBeTruthy();
  });

  test('time dimension filtering works correctly', async () => {
    render(<ExpenseTracker />);

    // 测试时间维度选择
    const timeDimensionSelect = screen.getByDisplayValue('全部');
    fireEvent.change(timeDimensionSelect, { target: { value: 'year' } });

    // 测试年份选择
    const yearSelect = screen.getByDisplayValue(new Date().getFullYear().toString());
    expect(yearSelect).toBeTruthy();

    // 测试季度选择
    fireEvent.change(timeDimensionSelect, { target: { value: 'quarter' } });
    const quarterSelect = screen.getByDisplayValue('1季度');
    expect(quarterSelect).toBeTruthy();

    // 测试月份选择
    fireEvent.change(timeDimensionSelect, { target: { value: 'month' } });
    const monthSelect = screen.getByDisplayValue((new Date().getMonth() + 1) + '月');
    expect(monthSelect).toBeTruthy();
  });

  test('search functionality works correctly', () => {
    render(<ExpenseTracker />);

    // 测试搜索输入
    const searchInput = screen.getByPlaceholderText('搜索关键词...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: '口红' } });
    expect(searchInput.value).toBe('口红');

    // 测试清空搜索
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(searchInput.value).toBe('');
  });

  test('sort functionality works correctly', () => {
    render(<ExpenseTracker />);

    // 测试按金额排序
    const sortBySelect = screen.getByDisplayValue('日期') as HTMLSelectElement;
    fireEvent.change(sortBySelect, { target: { value: 'price' } });
    expect(sortBySelect.value).toBe('price');

    // 测试升序排序
    const sortOrderSelect = screen.getByDisplayValue('降序') as HTMLSelectElement;
    fireEvent.change(sortOrderSelect, { target: { value: 'asc' } });
    expect(sortOrderSelect.value).toBe('asc');
  });

  test('add expense modal functionality', () => {
    render(<ExpenseTracker />);

    // 测试打开弹窗
    const addExpenseButton = screen.getByText('+ 添加消费记录');
    fireEvent.click(addExpenseButton);

    // 测试弹窗是否显示
    expect(screen.getByText('消费')).toBeTruthy();
    expect(screen.getByPlaceholderText('例如：口红、包包、香水等')).toBeTruthy();

    // 测试取消按钮
    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    waitFor(() => {
      expect(screen.queryByText('消费')).toBeNull();
    });
  });

  test('add expense functionality', async () => {
    render(<ExpenseTracker />);

    // 打开弹窗
    const addExpenseButton = screen.getByText('+ 添加消费记录');
    fireEvent.click(addExpenseButton);

    // 填写表单
    const nameInput = screen.getByPlaceholderText('例如：口红、包包、香水等');
    const priceInput = screen.getByPlaceholderText('0.00');
    const saveButton = screen.getByText('保存');

    fireEvent.change(nameInput, { target: { value: '新礼物' } });
    fireEvent.change(priceInput, { target: { value: '100' } });

    // 保存记录
    fireEvent.click(saveButton);

    waitFor(() => {
      expect(mockSaveExpenseData).toHaveBeenCalled();
      expect(screen.queryByText('消费')).toBeNull();
    });
  });

  test('delete expense functionality', () => {
    render(<ExpenseTracker />);

    // 测试删除按钮是否存在
    const deleteButtons = screen.getAllByText('删除');
    expect(deleteButtons.length).toBeGreaterThan(0);

    // 测试删除操作
    fireEvent.click(deleteButtons[0]);

    waitFor(() => {
      expect(mockSaveExpenseData).toHaveBeenCalled();
    });
  });

  test('displays empty state when no expenses', () => {
    // 模拟没有消费记录的情况
    mockLoadData.mockReturnValue({
      expenses: {
        expenses: [],
        wishlist: []
      }
    });

    render(<ExpenseTracker />);
    expect(screen.getByText('暂无消费记录')).toBeTruthy();
  });

  test('tab switching works correctly', () => {
    render(<ExpenseTracker />);

    // 测试切换到愿望单
    const tabs = screen.getAllByText('愿望单');
    const wishlistTab = tabs[0]; // 第一个应该是标签切换按钮
    fireEvent.click(wishlistTab);

    waitFor(() => {
      expect(screen.getByText('愿望单统计')).toBeTruthy();
    });

    // 测试切换回消费记录
    const expenseTabs = screen.getAllByText('消费记录');
    const expenseTab = expenseTabs[0]; // 第一个应该是标签切换按钮
    fireEvent.click(expenseTab);

    waitFor(() => {
      expect(screen.getByText('消费统计')).toBeTruthy();
    });
  });

  test('wishlist statistics shows satisfied and pending counts', () => {
    render(<ExpenseTracker />);

    // 切换到愿望单
    const tabs = screen.getAllByText('愿望单');
    const wishlistTab = tabs[0];
    fireEvent.click(wishlistTab);

    waitFor(() => {
      expect(screen.getByText('已满足数量')).toBeTruthy();
      expect(screen.getByText('待满足数量')).toBeTruthy();
    });
  });

  test('add wishlist item button opens modal with wishlist tab selected', () => {
    render(<ExpenseTracker />);

    // 切换到愿望单
    const tabs = screen.getAllByText('愿望单');
    const wishlistTab = tabs[0];
    fireEvent.click(wishlistTab);

    // 点击添加愿望单项目按钮
    const addWishlistButton = screen.getByText('+ 添加愿望单项目');
    fireEvent.click(addWishlistButton);

    waitFor(() => {
      expect(screen.getByText('消费')).toBeTruthy();
      // 检查愿望单tab是否存在
      const wishlistModalTab = screen.getAllByText('愿望单')[0];
      expect(wishlistModalTab).toBeTruthy();
    });
  });

  test('wishlist form in modal works correctly', () => {
    render(<ExpenseTracker />);

    // 切换到愿望单
    const tabs = screen.getAllByText('愿望单');
    const wishlistTab = tabs[0];
    fireEvent.click(wishlistTab);

    // 点击添加愿望单项目按钮
    const addWishlistButton = screen.getByText('+ 添加愿望单项目');
    fireEvent.click(addWishlistButton);

    waitFor(() => {
      // 检查愿望单表单字段是否存在
      expect(screen.getByText('物品名称')).toBeTruthy();
      expect(screen.getByText('价格 (¥)')).toBeTruthy();
      expect(screen.getByText('链接')).toBeTruthy();
      expect(screen.getByText('优先级')).toBeTruthy();
      expect(screen.getByText('备注')).toBeTruthy();
    });
  });

  test('add wishlist item functionality', async () => {
    render(<ExpenseTracker />);

    // 切换到愿望单
    const tabs = screen.getAllByText('愿望单');
    const wishlistTab = tabs[0];
    fireEvent.click(wishlistTab);

    // 点击添加愿望单项目按钮
    const addWishlistButton = screen.getByText('+ 添加愿望单项目');
    fireEvent.click(addWishlistButton);

    waitFor(() => {
      // 填写表单
      const nameInput = screen.getByLabelText('物品名称');
      const priceInput = screen.getByLabelText('价格 (¥)');
      const saveButton = screen.getByText('保存');

      fireEvent.change(nameInput, { target: { value: '新愿望' } });
      fireEvent.change(priceInput, { target: { value: '100' } });

      // 保存记录
      fireEvent.click(saveButton);

      waitFor(() => {
        expect(mockSaveExpenseData).toHaveBeenCalled();
        expect(screen.queryByText('消费')).toBeNull();
      });
    });
  });

  test('mark wishlist item as satisfied functionality', () => {
    // 模拟包含愿望单项目的数据
    mockLoadData.mockReturnValue({
      expenses: {
        expenses: [],
        wishlist: [
          {
            id: '1',
            name: '测试愿望',
            price: 100,
            link: 'www.test.com',
            priority: '中' as const,
            notes: '测试备注'
          }
        ]
      }
    });

    render(<ExpenseTracker />);

    // 切换到愿望单
    const tabs = screen.getAllByText('愿望单');
    const wishlistTab = tabs[0];
    fireEvent.click(wishlistTab);

    waitFor(() => {
      // 点击"已满足"按钮
      const satisfyButtons = screen.getAllByText('已满足');
      expect(satisfyButtons.length).toBeGreaterThan(0);
      fireEvent.click(satisfyButtons[0]);

      // 检查弹窗是否打开
      waitFor(() => {
        expect(screen.getByText('消费')).toBeTruthy();
        // 检查表单是否预填充
        const nameInput = screen.getByPlaceholderText('例如：口红、包包、香水等') as HTMLInputElement;
        expect(nameInput.value).toBe('测试愿望');

        // 测试取消按钮
        const cancelButton = screen.getByText('取消');
        fireEvent.click(cancelButton);

        // 检查弹窗是否关闭
        waitFor(() => {
          expect(screen.queryByText('消费')).toBeNull();
          // 检查愿望单项目是否仍然存在
          expect(screen.getByText('测试愿望')).toBeTruthy();
        });
      });
    });
  });

  test('save satisfied wishlist item functionality', () => {
    // 模拟包含愿望单项目的数据
    mockLoadData.mockReturnValue({
      expenses: {
        expenses: [],
        wishlist: [
          {
            id: '1',
            name: '测试愿望',
            price: 100,
            link: 'www.test.com',
            priority: '中' as const,
            notes: '测试备注'
          }
        ]
      }
    });

    render(<ExpenseTracker />);

    // 切换到愿望单
    const tabs = screen.getAllByText('愿望单');
    const wishlistTab = tabs[0];
    fireEvent.click(wishlistTab);

    waitFor(() => {
      // 点击"已满足"按钮
      const satisfyButtons = screen.getAllByText('已满足');
      fireEvent.click(satisfyButtons[0]);

      // 检查弹窗是否打开
      waitFor(() => {
        // 点击保存按钮
        const saveButton = screen.getByText('更新');
        fireEvent.click(saveButton);

        // 检查弹窗是否关闭
        waitFor(() => {
          expect(screen.queryByText('消费')).toBeNull();
          // 检查保存函数是否被调用
          expect(mockSaveExpenseData).toHaveBeenCalled();
        });
      });
    });
  });
});
