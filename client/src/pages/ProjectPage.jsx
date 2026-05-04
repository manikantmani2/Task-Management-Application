import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client.js';

export const ProjectPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/tasks?project=${encodeURIComponent(id)}`);
        if (mounted) setTasks(res.data.tasks || res.data || []);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => (mounted = false);
  }, [id]);

  return (
    <div className="pane">
      <button className="ghost-button" onClick={() => navigate(-1)}>Back</button>
      <h2>Project: {id}</h2>
      <div className="board-stack">
        {tasks.length === 0 && <p>No tasks for this project.</p>}
        {tasks.map((task) => (
          <article key={task._id} className="task-card">
            <h4 onClick={() => navigate(`/task/${task._id}`)}>{task.title}</h4>
            <p>{task.description}</p>
            <div className="task-meta">
              <span>{task.assignee?.name || 'Unassigned'}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ProjectPage;
