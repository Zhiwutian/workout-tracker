import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, me, loading } = useAuth();
  const location = useLocation();

  if (loading && token) {
    return (
      <p className="text-sm text-slate-600" role="status">
        Loading session…
      </p>
    );
  }

  if (!token || !me) {
    return (
      <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
}
