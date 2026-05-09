import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useTasks } from '../context/TaskContext.jsx';

const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toIsoDateTime = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const TaskModal = ({ task, mode = 'edit', onClose }) => {
  const { refresh } = useTasks();
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    dueDate: toDateInputValue(task?.dueDate),
    estimateHours: task?.estimateHours || 0,
    tags: Array.isArray(task?.tags) ? task.tags.join(', ') : ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(mode === 'delete');

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!task) return null;

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.patch(`/tasks/${task._id}`, {
        ...form,
        dueDate: toIsoDateTime(form.dueDate),
        estimateHours: Number(form.estimateHours) || 0,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      });
      await refresh();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');

    try {
      await api.delete(`/tasks/${task._id}`);
      await refresh();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete task');
    } finally {
      setSaving(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-shell glass-card" role="dialog" aria-modal="true" aria-labelledby="task-modal-title" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <p className="eyebrow">Task details</p>
            <h3 id="task-modal-title">{mode === 'delete' ? 'Delete task' : 'Edit task'}</h3>
          </div>
          <button className="ghost-button" onClick={onClose}>Close</button>
        </header>

        {mode === 'delete' || confirmingDelete ? (
          <div className="confirm-panel">
            <p>
              {mode === 'delete'
                ? 'Delete this task permanently?'
                : 'Switch to delete confirmation for this task?'}
            </p>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button className="ghost-button" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="ghost-button danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting...' : 'Yes, delete'}</button>
            </div>
          </div>
        ) : (
          <form className="modal-form" onSubmit={handleSave}>
            <label>
              Title
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </label>

            <label>
              Description
              <textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>

            <div className="form-grid">
              <label>
                Priority
                <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <label>
                Status
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="todo">Todo</option>
                  <option value="in-progress">In progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label>
                Due date
                <input type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
              </label>
              <label>
                Estimate hours
                <input type="number" min="0" step="0.5" value={form.estimateHours} onChange={(event) => setForm({ ...form, estimateHours: event.target.value })} />
              </label>
            </div>

            <label>
              Tags
              <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
            </label>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
              <button className="ghost-button danger" type="button" onClick={() => setConfirmingDelete(true)} disabled={saving}>Delete task</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};