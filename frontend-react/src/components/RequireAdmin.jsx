import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth.js';

export default function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/admin-login" replace />;
  if (user.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
}
