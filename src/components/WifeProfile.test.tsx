import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WifeProfile from './WifeProfile';
import { saveWifeData, saveCycleData, loadData, saveImages } from '../services/storage';
import Layout from './Layout';

// 模拟依赖
jest.mock('./Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: any }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

jest.mock('../services/storage', () => ({
  saveWifeData: jest.fn(),
  saveCycleData: jest.fn(),
  loadData: jest.fn(),
  saveImages: jest.fn(),
}));

const mockSaveWifeData = saveWifeData as jest.MockedFunction<typeof saveWifeData>;
const mockSaveCycleData = saveCycleData as jest.MockedFunction<typeof saveCycleData>;
const mockLoadData = loadData as jest.MockedFunction<typeof loadData>;
const mockSaveImages = saveImages as jest.MockedFunction<typeof saveImages>;

describe('WifeProfile Component', () => {
  beforeEach(() => {
    // 重置所有模拟函数
    jest.clearAllMocks();
    
    // 模拟 loadData 返回空数据
    mockLoadData.mockReturnValue(undefined);
  });

  test('renders the component successfully', () => {
    render(<WifeProfile />);
    expect(screen.getByText('老婆档案')).toBeTruthy();
    expect(screen.getByText('基本信息')).toBeTruthy();
    expect(screen.getByText('个人信息')).toBeTruthy();
    expect(screen.getByText('纪念日')).toBeTruthy();
    expect(screen.getByText('生理周期')).toBeTruthy();
  });

  test('updates form inputs correctly', () => {
    render(<WifeProfile />);

    // 测试姓名输入
    const nameInput = screen.getByLabelText('姓名 *') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: '测试老婆' } });
    expect(nameInput.value).toBe('测试老婆');

    // 测试生日输入
    const birthdayInput = screen.getByLabelText('生日 *') as HTMLInputElement;
    fireEvent.change(birthdayInput, { target: { value: '2000-01-01' } });
    expect(birthdayInput.value).toBe('2000-01-01');

    // 测试身高输入
    const heightInput = screen.getByLabelText('身高 (cm)') as HTMLInputElement;
    fireEvent.change(heightInput, { target: { value: '160' } });
    expect(heightInput.value).toBe('160');

    // 测试体重输入
    const weightInput = screen.getByLabelText('体重 (kg)') as HTMLInputElement;
    fireEvent.change(weightInput, { target: { value: '50' } });
    expect(weightInput.value).toBe('50');
  });

  test('adds and removes anniversaries', () => {
    render(<WifeProfile />);

    // 测试添加纪念日
    const dateInputs = screen.getAllByLabelText('日期') as HTMLInputElement[];
    const anniversaryDateInput = dateInputs[0]; // 第一个日期输入框是纪念日的
    const anniversaryTitleInput = screen.getByLabelText('标题') as HTMLInputElement;
    const addAnniversaryButton = screen.getAllByText('添加')[0];

    fireEvent.change(anniversaryDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(anniversaryTitleInput, { target: { value: '结婚纪念日' } });
    fireEvent.click(addAnniversaryButton);

    expect(screen.getByText('结婚纪念日')).toBeTruthy();

    // 测试删除纪念日
    const deleteButtons = screen.getAllByText('删除');
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    waitFor(() => {
      expect(screen.queryByText('结婚纪念日')).toBeNull();
    });
  });

  test('saves cycle settings when submitting form', () => {
    render(<WifeProfile />);

    // 填写生理周期设置
    const lastPeriodStartInput = screen.getByLabelText('上次经期开始日期') as HTMLInputElement;
    const cycleLengthInput = screen.getByLabelText('周期长度 (天)') as HTMLInputElement;
    const periodLengthInput = screen.getByLabelText('经期长度 (天)') as HTMLInputElement;
    
    // 填写表单必填字段
    const nameInput = screen.getByLabelText('姓名 *') as HTMLInputElement;
    const birthdayInput = screen.getByLabelText('生日 *') as HTMLInputElement;
    const submitButton = screen.getByText('保存老婆档案');

    // 模拟头像上传
    const avatarInput = screen.getByLabelText('照片（必填）') as HTMLInputElement;
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
    fireEvent.change(avatarInput, { target: { files: [file] } });

    // 填写生理周期数据
    fireEvent.change(lastPeriodStartInput, { target: { value: '2024-01-01' } });
    fireEvent.change(cycleLengthInput, { target: { value: '28' } });
    fireEvent.change(periodLengthInput, { target: { value: '5' } });
    
    // 填写基本信息
    fireEvent.change(nameInput, { target: { value: '测试老婆' } });
    fireEvent.change(birthdayInput, { target: { value: '2000-01-01' } });
    
    // 提交表单
    fireEvent.click(submitButton);

    waitFor(() => {
      expect(mockSaveCycleData).toHaveBeenCalled();
      expect(mockSaveWifeData).toHaveBeenCalled();
    });
  });

  test('submits form successfully with valid data', () => {
    render(<WifeProfile />);

    // 填写表单
    const nameInput = screen.getByLabelText('姓名 *') as HTMLInputElement;
    const birthdayInput = screen.getByLabelText('生日 *') as HTMLInputElement;
    const submitButton = screen.getByText('保存老婆档案');

    // 模拟头像上传
    const avatarInput = screen.getByLabelText('照片（必填）') as HTMLInputElement;
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
    fireEvent.change(avatarInput, { target: { files: [file] } });

    fireEvent.change(nameInput, { target: { value: '测试老婆' } });
    fireEvent.change(birthdayInput, { target: { value: '2000-01-01' } });
    fireEvent.click(submitButton);

    waitFor(() => {
      expect(mockSaveWifeData).toHaveBeenCalled();
    });
  });

  test('shows error message for required fields', () => {
    render(<WifeProfile />);

    const submitButton = screen.getByText('保存老婆档案');
    fireEvent.click(submitButton);

    waitFor(() => {
      expect(screen.getByText('请填写必填字段（姓名、生日、照片）')).toBeTruthy();
    });
  });
});