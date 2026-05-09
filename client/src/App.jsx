import { Suspense, lazy, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';

const AuthScreen = lazy(() =>
  import('./components/AuthScreen.jsx').then((module) => ({
    default: module.AuthScreen
  }))
);
const SummaryCards = lazy(() =>
  import('./components/SummaryCards.jsx').then((module) => ({
    default: module.SummaryCards
  }))
);
const AnalyticsPanel = lazy(() =>
  import('./components/AnalyticsPanel.jsx').then((module) => ({
    default: module.AnalyticsPanel
  }))
);
const TaskBoard = lazy(() =>
  import('./components/TaskBoard.jsx').then((module) => ({
    default: module.TaskBoard
  }))
);
const TaskForm = lazy(() =>
  import('./components/TaskForm.jsx').then((module) => ({
    default: module.TaskForm
  }))
);
const TeamPanel = lazy(() =>
  import('./components/TeamPanel.jsx').then((module) => ({
    default: module.TeamPanel
  }))
);
const TaskDetail = lazy(() => import('./pages/TaskDetail.jsx'));
const UserProfile = lazy(() => import('./pages/UserProfile.jsx'));
const ProjectPage = lazy(() => import('./pages/ProjectPage.jsx'));

const LoadingFallback = () => <div className="panel">Loading...</div>;

const Home = () => {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <Layout activeView={activeView} setActiveView={setActiveView}>
      {activeView === 'dashboard' && (
        <Suspense fallback={<LoadingFallback />}>
          <div className="content-stack">
            <SummaryCards />
            <AnalyticsPanel />
          </div>
        </Suspense>
      )}

      {activeView === 'board' && (
        <Suspense fallback={<LoadingFallback />}>
          <div className="content-stack">
            <TaskForm />
            <TaskBoard />
          </div>
        </Suspense>
      )}

      {activeView === 'users' && (
        <Suspense fallback={<LoadingFallback />}>
          <TeamPanel />
        </Suspense>
      )}
    </Layout>
  );
};

export const App = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AuthScreen />
      </Suspense>
    );
  }

  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/task/:id" element={<TaskDetail />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/project/:id" element={<ProjectPage />} />
        </Routes>
      </Suspense>
    </ProtectedRoute>
  );
};