import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthScreen } from './components/AuthScreen.jsx';
import { Layout } from './components/Layout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { SummaryCards } from './components/SummaryCards.jsx';
import { AnalyticsPanel } from './components/AnalyticsPanel.jsx';
import { TaskBoard } from './components/TaskBoard.jsx';
import { TaskForm } from './components/TaskForm.jsx';
import { TeamPanel } from './components/TeamPanel.jsx';
import { useAuth } from './context/AuthContext.jsx';
import TaskDetail from './pages/TaskDetail.jsx';
import UserProfile from './pages/UserProfile.jsx';
import ProjectPage from './pages/ProjectPage.jsx';

const Home = () => {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <Layout activeView={activeView} setActiveView={setActiveView}>
      {activeView === 'dashboard' && (
        <div className="content-stack">
          <SummaryCards />
          <AnalyticsPanel />
        </div>
      )}

      {activeView === 'board' && (
        <div className="content-stack">
          <TaskForm />
          <TaskBoard />
        </div>
      )}

      {activeView === 'users' && <TeamPanel />}
    </Layout>
  );
};

export const App = () => {
  const { user } = useAuth();

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <ProtectedRoute>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/task/:id" element={<TaskDetail />} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/project/:id" element={<ProjectPage />} />
      </Routes>
    </ProtectedRoute>
  );
};