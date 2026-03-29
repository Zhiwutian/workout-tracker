/**
 * Root React tree: `AuthProvider`, nav, and `react-router` routes.
 * Heavy pages are `lazy()`-loaded so the first paint stays smaller (see Vite code-split output).
 */
import { NavLinkButton } from '@/components/app/NavLinkButton';
import { EmptyState } from '@/components/ui';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const WorkoutsPage = lazy(async () => ({
  default: (await import('@/pages/WorkoutsPage')).WorkoutsPage,
}));
const WorkoutDetailPage = lazy(async () => ({
  default: (await import('@/pages/WorkoutDetailPage')).WorkoutDetailPage,
}));
const DashboardPage = lazy(async () => ({
  default: (await import('@/pages/DashboardPage')).DashboardPage,
}));
const ExercisesPage = lazy(async () => ({
  default: (await import('@/pages/ExercisesPage')).ExercisesPage,
}));
const ProfilePage = lazy(async () => ({
  default: (await import('@/pages/ProfilePage')).ProfilePage,
}));
const SignInPage = lazy(async () => ({
  default: (await import('@/pages/SignInPage')).SignInPage,
}));
const AboutPage = lazy(async () => ({
  default: (await import('@/pages/AboutPage')).AboutPage,
}));

function AppNav() {
  const { me, signOut } = useAuth();

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2">
      {me ? (
        <>
          <NavLinkButton to="/">Workouts</NavLinkButton>
          <NavLinkButton to="/exercises">Exercises</NavLinkButton>
          <NavLinkButton to="/dashboard">Dashboard</NavLinkButton>
          <NavLinkButton to="/profile">Profile</NavLinkButton>
          <NavLinkButton to="/about">About</NavLinkButton>
          {me.isGuest ? (
            <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
              Guest
            </span>
          ) : null}
          <button
            type="button"
            className="ml-auto rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            onClick={() => signOut()}>
            Sign out
          </button>
        </>
      ) : (
        <>
          <NavLinkButton to="/sign-in">Sign in</NavLinkButton>
          <NavLinkButton to="/about">About</NavLinkButton>
        </>
      )}
    </nav>
  );
}

/**
 * App shell: auth-aware navigation and workout routes.
 */
export default function App() {
  return (
    <AuthProvider>
      <main className="mx-auto min-h-screen w-full max-w-3xl bg-slate-50 px-6 py-10 text-slate-900">
        <AppNav />
        <Suspense
          fallback={<p className="text-sm text-slate-600">Loading page...</p>}>
          <Routes>
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <WorkoutsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts/:workoutId"
              element={
                <ProtectedRoute>
                  <WorkoutDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exercises"
              element={
                <ProtectedRoute>
                  <ExercisesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={
                <EmptyState
                  title="Page not found"
                  description="The route you requested does not exist."
                  actions={
                    <NavLinkButton
                      to="/"
                      className="bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 hover:text-white">
                      Go home
                    </NavLinkButton>
                  }
                />
              }
            />
          </Routes>
        </Suspense>
      </main>
    </AuthProvider>
  );
}
