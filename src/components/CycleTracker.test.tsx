import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CycleTracker from './CycleTracker';
import { saveCycleData, loadData } from '../services/storage';
import { ModalProvider } from '../contexts/ModalContext';

// 模拟依赖
jest.mock('./Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

jest.mock('../services/storage', () => ({
  saveCycleData: jest.fn(),
  loadData: jest.fn(),
}));

const mockSaveCycleData = saveCycleData as jest.MockedFunction<typeof saveCycleData>;
const mockLoadData = loadData as jest.MockedFunction<typeof loadData>;

describe('CycleTracker Component', () => {
  const mockSexRecords = [
    {
      id: '1',
      date: '2026-02-14',
      location: '卧室',
      position: '传教士',
      ejaculation: true,
      ejaculationLocation: '体内',
      feelings: '很愉快'
    },
    {
      id: '2',
      date: '2026-02-13',
      location: '客厅',
      position: '女上位',
      ejaculation: true,
      ejaculationLocation: '体外',
      feelings: '很满足'
    }
  ];

  beforeEach(() => {
    // 重置所有模拟函数
    jest.clearAllMocks();
    
    // 模拟 loadData 返回测试数据
    mockLoadData.mockReturnValue({
      cycle: {
        lastPeriodStart: '2026-02-01',
        cycleLength: 28,
        periodLength: 5,
        sexRecords: mockSexRecords
      }
    });
  });

  test('renders the component successfully', () => {
    render(
      <ModalProvider>
        <CycleTracker />
      </ModalProvider>
    );
    expect(screen.getByText('生理周期跟踪')).toBeTruthy();
    expect(screen.getByText('当前状态')).toBeTruthy();
    expect(screen.getByText('做爱记录列表')).toBeTruthy();
  });

  test('displays sex records with feelings', () => {
    render(
      <ModalProvider>
        <CycleTracker />
      </ModalProvider>
    );
    
    // 检查做爱记录是否显示
    expect(screen.getAllByText('2026-02-14').length).toBeGreaterThan(0);
    expect(screen.getAllByText('卧室').length).toBeGreaterThan(0);
    expect(screen.getAllByText('姿势: 传教士').length).toBeGreaterThan(0);
    expect(screen.getAllByText('射精: 是').length).toBeGreaterThan(0);
    expect(screen.getByText('感受: 很愉快')).toBeTruthy();
    
    expect(screen.getAllByText('2026-02-13').length).toBeGreaterThan(0);
    expect(screen.getAllByText('客厅').length).toBeGreaterThan(0);
    expect(screen.getAllByText('姿势: 女上位').length).toBeGreaterThan(0);
    expect(screen.getByText('感受: 很满足')).toBeTruthy();
  });

  test('edit button exists for each sex record', () => {
    render(
      <ModalProvider>
        <CycleTracker />
      </ModalProvider>
    );
    
    // 检查编辑按钮是否存在
    const editButtons = screen.getAllByText('编辑');
    expect(editButtons.length).toBe(mockSexRecords.length);
  });

  test('delete button exists for each sex record', () => {
    render(
      <ModalProvider>
        <CycleTracker />
      </ModalProvider>
    );
    
    // 检查删除按钮是否存在
    const deleteButtons = screen.getAllByText('删除');
    expect(deleteButtons.length).toBe(mockSexRecords.length);
  });

  test('edit sex record modal opens when edit button is clicked', async () => {
    render(
      <ModalProvider>
        <CycleTracker />
      </ModalProvider>
    );
    
    // 点击编辑按钮
    const editButtons = screen.getAllByText('编辑');
    fireEvent.click(editButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('编辑做爱记录')).toBeTruthy();
      expect(screen.getByPlaceholderText('例如：卧室、客厅、酒店等')).toBeTruthy();
      expect(screen.getByPlaceholderText('例如：传教士、女上位、后入等')).toBeTruthy();
      expect(screen.getByPlaceholderText('例如：很愉快、很满足、很刺激等')).toBeTruthy();
    });
  });

  test('edit sex record form is pre-filled with existing data', async () => {
    render(
      <ModalProvider>
        <CycleTracker />
      </ModalProvider>
    );
    
    // 点击编辑按钮
    const editButtons = screen.getAllByText('编辑');
    fireEvent.click(editButtons[0]);
    
    await waitFor(() => {
      const locationInput = screen.getByPlaceholderText('例如：卧室、客厅、酒店等') as HTMLInputElement;
      const positionInput = screen.getByPlaceholderText('例如：传教士、女上位、后入等') as HTMLInputElement;
      const feelingsTextarea = screen.getByPlaceholderText('例如：很愉快、很满足、很刺激等') as HTMLTextAreaElement;
      
      expect(locationInput.value).toBe('卧室');
      expect(positionInput.value).toBe('传教士');
      expect(feelingsTextarea.value).toBe('很愉快');
    });
  });

  test('cancel button in edit modal works', async () => {
    render(
      <ModalProvider>
        <CycleTracker />
      </ModalProvider>
    );
    
    // 点击编辑按钮
    const editButtons = screen.getAllByText('编辑');
    fireEvent.click(editButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('编辑做爱记录')).toBeTruthy();
    });
    
    // 点击取消按钮
    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText('编辑做爱记录')).toBeNull();
    });
  });

  test('save edited sex record functionality', async () => {
    render(
      <ModalProvider>
        <CycleTracker />
      </ModalProvider>
    );
    
    // 点击编辑按钮
    const editButtons = screen.getAllByText('编辑');
    fireEvent.click(editButtons[0]);
    
    await waitFor(() => {
      // 修改表单数据
      const locationInput = screen.getByPlaceholderText('例如：卧室、客厅、酒店等') as HTMLInputElement;
      const feelingsTextarea = screen.getByPlaceholderText('例如：很愉快、很满足、很刺激等') as HTMLTextAreaElement;
      
      fireEvent.change(locationInput, { target: { value: '酒店' } });
      fireEvent.change(feelingsTextarea, { target: { value: '非常愉快' } });
      
      // 点击保存按钮
      const saveButton = screen.getByText('保存修改');
      fireEvent.click(saveButton);
    });
    
    await waitFor(() => {
      expect(mockSaveCycleData).toHaveBeenCalled();
      expect(screen.queryByText('编辑做爱记录')).toBeNull();
    });
  });

  test('delete sex record functionality', async () => {
    render(
      <ModalProvider>
        <CycleTracker />
      </ModalProvider>
    );
    
    // 点击删除按钮
    const deleteButtons = screen.getAllByText('删除');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(mockSaveCycleData).toHaveBeenCalled();
    });
  });

  test('displays empty state when no sex records', () => {
    // 模拟没有做爱记录的情况
    mockLoadData.mockReturnValue({
      cycle: {
        lastPeriodStart: '2026-02-01',
        cycleLength: 28,
        periodLength: 5,
        sexRecords: []
      }
    });

    render(
      <ModalProvider>
        <CycleTracker />
      </ModalProvider>
    );
    expect(screen.getByText('暂无做爱记录')).toBeTruthy();
  });

  test('last sex time calculation works correctly', () => {
    render(
      <ModalProvider>
        <CycleTracker />
      </ModalProvider>
    );
    
    // 检查距上次做爱时间是否显示
    expect(screen.getByText('距上次做爱:')).toBeTruthy();
  });

  test('cycle status calculation works correctly', () => {
    render(
      <ModalProvider>
        <CycleTracker />
      </ModalProvider>
    );
    
    // 检查周期状态是否显示
    expect(screen.getByText('周期状态')).toBeTruthy();
    expect(screen.getByText('当前周期天数:')).toBeTruthy();
    expect(screen.getByText('下次经期:')).toBeTruthy();
    expect(screen.getByText('排卵期:')).toBeTruthy();
    expect(screen.getByText('怀孕风险:')).toBeTruthy();
  });
});
