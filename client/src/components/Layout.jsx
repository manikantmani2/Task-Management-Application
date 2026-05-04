import { LogOut, Bell, LayoutDashboard, KanbanSquare, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTasks } from '../context/TaskContext.jsx';

export const Layout = ({ activeView, setActiveView, children }) => {
  const { user, logout } = useAuth();
  const { notifications } = useTasks();
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">TF</div>
          <h1>TaskFlow</h1>
          <p>Plan, assign, and ship work with clarity.</p>
        </div>

        <nav className="sidebar-nav">
          <button className={activeView === 'dashboard' ? 'active' : ''} onClick={() => setActiveView('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className={activeView === 'board' ? 'active' : ''} onClick={() => setActiveView('board')}>
            <KanbanSquare size={18} /> Board
          </button>
          <button className={activeView === 'users' ? 'active' : ''} onClick={() => setActiveView('users')}>
            <Users size={18} /> Team
          </button>
        </nav>

        <div className="sidebar-footer">
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
          <button className="ghost-button" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Real-time task workspace</p>
            <h2>Operations dashboard</h2>
          </div>
          <div className="topbar-actions">
            <div className="notification-pill">
              <Bell size={16} />
              <span>{unreadCount}</span>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};