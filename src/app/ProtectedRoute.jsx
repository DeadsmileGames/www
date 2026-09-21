import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children, role }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return null;

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/account" replace />;
  }

  return children;
}
