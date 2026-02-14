import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ObservationLog from './ObservationLog';
import { loadData, saveObservation } from '../services/storage';
import { useModal } from '../contexts/ModalContext';

// Mock dependencies
jest.mock('../services/storage');
jest.mock('../contexts/ModalContext');
jest.mock('./Layout', () => ({
  children
}: { children: React.ReactNode }) => <div>{children}</div>
);

const mockLoadData = loadData as jest.MockedFunction<typeof loadData>;
const mockSaveObservation = saveObservation as jest.MockedFunction<typeof saveObservation>;
const mockUseModal = useModal as jest.MockedFunction<typeof useModal>;

describe('ObservationLog', () => {
  const mockObservations = [
    {
      id: '1',
      date: '2026-02-14',
      mood: '😊',
      content: '今天是情人节，老婆很开心',
      images: []
    },
    {
      id: '2',
      date: '2026-02-13',
      mood: '😢',
      content: '老婆今天有点难过',
      images: []
    }
  ];

  beforeEach(() => {
    mockLoadData.mockReturnValue({
      observations: mockObservations
    });
    mockUseModal.mockReturnValue({
      showSexModal: false,
      setShowSexModal: jest.fn(),
      showWishModal: false,
      setShowWishModal: jest.fn(),
      showAddObservationModal: false,
      setShowAddObservationModal: jest.fn(),
      observationUpdated: false,
      setObservationUpdated: jest.fn()
    });
    mockSaveObservation.mockImplementation(() => {});
    window.confirm = jest.fn();
    window.alert = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders observation log with data', async () => {
    render(<ObservationLog />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('观察日志')).toBeInTheDocument();
    });

    // Check if observations are rendered
    expect(screen.getByText('2026-02-14')).toBeInTheDocument();
    expect(screen.getByText('2026-02-13')).toBeInTheDocument();
    // Check for partial text since it might be truncated
    expect(screen.getByText(/今天是情人节，老婆很开心/)).toBeInTheDocument();
    expect(screen.getByText(/老婆今天有点难过/)).toBeInTheDocument();
  });

  test('handles delete confirmation - confirm', async () => {
    // Mock window.confirm to return true
    (window.confirm as jest.MockedFunction<typeof window.confirm>).mockReturnValue(true);

    render(<ObservationLog />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('观察日志')).toBeInTheDocument();
    });

    // Find and click delete button for first observation
    const deleteButtons = screen.getAllByText('🗑️');
    fireEvent.click(deleteButtons[0]);

    // Check if confirm was called
    expect(window.confirm).toHaveBeenCalledWith('确定要删除这条观察记录吗？此操作不可恢复。');

    // Check if saveObservation was called with updated observations
    await waitFor(() => {
      expect(mockSaveObservation).toHaveBeenCalledWith([mockObservations[1]]);
    });
  });

  test('handles delete confirmation - cancel', async () => {
    // Mock window.confirm to return false
    (window.confirm as jest.MockedFunction<typeof window.confirm>).mockReturnValue(false);

    render(<ObservationLog />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('观察日志')).toBeInTheDocument();
    });

    // Find and click delete button for first observation
    const deleteButtons = screen.getAllByText('🗑️');
    fireEvent.click(deleteButtons[0]);

    // Check if confirm was called
    expect(window.confirm).toHaveBeenCalledWith('确定要删除这条观察记录吗？此操作不可恢复。');

    // Check if saveObservation was NOT called
    expect(mockSaveObservation).not.toHaveBeenCalled();
  });

  test('opens edit modal when edit button is clicked', async () => {
    render(<ObservationLog />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('观察日志')).toBeInTheDocument();
    });

    // Find and click edit button for first observation
    const editButtons = screen.getAllByText('✏️');
    fireEvent.click(editButtons[0]);

    // Check if edit modal is opened
    await waitFor(() => {
      expect(screen.getByText('编辑观察记录')).toBeInTheDocument();
    });
  });

  test('handles edit form submission', async () => {
    render(<ObservationLog />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('观察日志')).toBeInTheDocument();
    });

    // Find and click edit button for first observation
    const editButtons = screen.getAllByText('✏️');
    fireEvent.click(editButtons[0]);

    // Wait for edit modal to open
    await waitFor(() => {
      expect(screen.getByText('编辑观察记录')).toBeInTheDocument();
    });

    // Update form fields
    const contentInput = screen.getByPlaceholderText('记录下你观察到的细节...') as HTMLTextAreaElement;
    fireEvent.change(contentInput, { target: { value: '更新后的内容' } });

    // Click save button
    const saveButton = screen.getByText('保存修改');
    fireEvent.click(saveButton);

    // Check if saveObservation was called with updated observations
    await waitFor(() => {
      expect(mockSaveObservation).toHaveBeenCalledWith([
        {
          id: '1',
          date: '2026-02-14',
          mood: '😊',
          content: '更新后的内容',
          images: []
        },
        mockObservations[1]
      ]);
    });
  });
});
