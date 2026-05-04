import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { format } from 'date-fns';

export const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/tasks/${id}`);
        if (mounted) setTask(res.data.task || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="pane">Loading task...</div>;
  if (!task) return <div className="pane">Task not found.</div>;

  return (
    <div className="pane">
      <button className="ghost-button" onClick={() => navigate(-1)}>Back</button>
      <h2>{task.title}</h2>
      <p>{task.description}</p>

      <dl className="detail-list">
        <dt>Assignee</dt>
        <dd>{task.assignee?.name || 'Unassigned'}</dd>
        <dt>Status</dt>
        <dd>{task.status}</dd>
        <dt>Priority</dt>
        <dd>{task.priority}</dd>
        <dt>Due</dt>
        <dd>{task.dueDate ? format(new Date(task.dueDate), 'PPP p') : '—'}</dd>
        <dt>Project</dt>
        <dd>{task.project || 'General'}</dd>
      </dl>
    </div>
  );
};

export default TaskDetail;
