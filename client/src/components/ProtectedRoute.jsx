import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading application...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};