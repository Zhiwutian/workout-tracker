/**
 * Wraps routes that need a logged-in user. Reads `AuthContext`; redirects to `/sign-in` if absent.
 */
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { me, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <p className="text-sm text-slate-600" role="status">
        Loading session…
      </p>
    );
  }

  if (!me) {
    return (
      <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
}
