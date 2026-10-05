import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, guestsOnly = false, adminOnly = false }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  if (guestsOnly && isAuthenticated) return <Navigate to="/events" replace />;
  if (!guestsOnly && !isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && !isAdmin) {
    return <Navigate to="/events" state={{ accessDenied: true }} replace />;
  }
  return children;
}