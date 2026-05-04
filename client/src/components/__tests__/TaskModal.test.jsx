import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskModal } from '../TaskModal.jsx';

const refresh = vi.fn();

vi.mock('../../context/TaskContext.jsx', () => ({
  useTasks: () => ({ refresh })
}));

vi.mock('../../api/client.js', () => ({
  default: {
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

describe('TaskModal', () => {
  beforeEach(() => {
    refresh.mockReset();
  });

  it('renders edit fields and opens delete confirmation', () => {
    render(
      <TaskModal
        task={{
          _id: '507f1f77bcf86cd799439011',
          title: 'Demo task',
          description: 'Sample description',
          priority: 'high',
          status: 'todo',
          dueDate: new Date('2026-01-01T10:00:00Z').toISOString(),
          estimateHours: 3,
          tags: ['frontend', 'api']
        }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Title')).toHaveValue('Demo task');
    expect(screen.getByText('Edit task')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /delete task/i }));

    expect(screen.getByText('Switch to delete confirmation for this task?')).toBeInTheDocument();
  });
});