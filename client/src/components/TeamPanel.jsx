import api from '../api/client.js';
import { useTasks } from '../context/TaskContext.jsx';

export const TeamPanel = () => {
  const { notifications } = useTasks();

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
  };

  return (
    <section className="team-panel glass-card">
      <div className="panel-header">
        <h3>Notifications</h3>
        <button className="ghost-button" onClick={markAllRead}>Mark all read</button>
      </div>

      <div className="notification-list">
        {notifications.map((notification) => (
          <article key={notification.id || notification._id} className={notification.readAt ? 'notification-row read' : 'notification-row'}>
            <strong>{notification.type}</strong>
            <p>{notification.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
};