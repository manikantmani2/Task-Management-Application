import { useState } from 'react';
import api from '../api/client.js';
import { useTasks } from '../context/TaskContext.jsx';

const initialForm = {
  title: '',
  description: '',
  priority: 'medium',
  status: 'todo',
  dueDate: '',
  estimateHours: 0,
  tags: ''
};

const toIsoDateTime = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

export const TaskForm = () => {
  const { refresh } = useTasks();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post('/tasks', {
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: form.status,
        dueDate: toIsoDateTime(form.dueDate),
        estimateHours: Number(form.estimateHours) || 0,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      });

      setForm(initialForm);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="task-form glass-card" onSubmit={handleSubmit}>
      <h3>New task</h3>
      <div className="form-grid">
        <label>
          Title
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </label>
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
      </div>

      <label>
        Description
        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} />
      </label>

      <div className="form-grid">
        <label>
          Estimate hours
          <input type="number" min="0" step="0.5" value={form.estimateHours} onChange={(event) => setForm({ ...form, estimateHours: event.target.value })} />
        </label>
        <label>
          Tags
          <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="design, api, sprint" />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Create task'}
      </button>
    </form>
  );
};