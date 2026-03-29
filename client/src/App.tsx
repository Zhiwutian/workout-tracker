/**
 * Root React tree: `AuthProvider`, nav, and `react-router` routes.
 * Heavy pages are `lazy()`-loaded so the first paint stays smaller (see Vite code-split output).
 */
import { AppMenuHeader } from '@/components/app/AppMenuHeader';
import { NavLinkButton } from '@/components/app/NavLinkButton';
import { EmptyState, Button } from '@/components/ui';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { cn } from '@/lib';
import {
  effectiveDarkShell,
  syncDocumentElementDisplayShell,
} from '@/lib/display-shell';
import { useSystemPrefersDark } from '@/lib/use-system-prefers-dark';
import { useAppState, type ThemeMode } from '@/state';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
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

function mainLayoutClassNames(
  highContrast: boolean,
  themeMode: ThemeMode,
  systemDark: boolean,
): string {
  const dark = effectiveDarkShell(highContrast, themeMode, systemDark);
  const contrastClassName = highContrast
    ? 'bg-white text-black'
    : dark
      ? 'bg-slate-950 text-slate-100'
      : 'bg-slate-50 text-slate-900';
  return `mx-auto min-h-screen w-full max-w-3xl px-6 py-10 ${contrastClassName}`;
}

/**
 * Sticky header + hamburger menu with left slide-out nav (parent Support-style shell).
 * Overlay scrim z-[70], drawer z-[80]; toasts z-[100] (see ToastProvider).
 */
function AppShellNav() {
  const { me, signOut } = useAuth();
  const state = useAppState();
  const systemDark = useSystemPrefersDark();
  const darkShell = effectiveDarkShell(
    state.highContrast,
    state.themeMode,
    systemDark,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (menuOpen) setMenuOpen(false);
    }
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || !menuScrollRef.current) return;
    menuScrollRef.current.scrollTop = 0;
  }, [menuOpen]);

  const navHeaderBorder = state.highContrast
    ? 'border-slate-300'
    : darkShell && !state.highContrast
      ? 'border-slate-700'
      : 'border-slate-200';

  const navBackdrop = state.highContrast
    ? 'bg-white/80'
    : darkShell && !state.highContrast
      ? 'bg-slate-950/80'
      : 'bg-slate-50/80';

  const drawerBorder = state.highContrast
    ? 'border-slate-300'
    : darkShell
      ? 'border-slate-600'
      : 'border-slate-200';
  const drawerBg = state.highContrast
    ? 'bg-white'
    : darkShell
      ? 'bg-slate-900'
      : 'bg-white';
  const drawerText = state.highContrast
    ? 'text-black'
    : darkShell
      ? 'text-slate-100'
      : 'text-slate-900';
  const subMuted = state.highContrast
    ? 'text-slate-700'
    : darkShell
      ? 'text-slate-300'
      : 'text-slate-600';

  const navActiveDrawer = state.highContrast
    ? undefined
    : darkShell
      ? 'bg-slate-700 text-slate-100'
      : undefined;

  const navLinkDrawer = cn(
    'justify-start text-base font-semibold',
    state.highContrast
      ? 'text-slate-900 hover:bg-slate-100'
      : darkShell
        ? 'text-slate-100 hover:bg-slate-800'
        : 'text-slate-700 hover:bg-slate-100',
  );

  const closeBtnDrawer = state.highContrast
    ? 'text-slate-800 hover:bg-slate-100'
    : darkShell
      ? 'text-slate-200 hover:bg-slate-800'
      : undefined;

  const menuBtnClass = cn(
    'inline-flex min-h-11 items-center gap-2 px-3 text-base font-semibold',
    state.highContrast
      ? 'text-slate-800'
      : darkShell
        ? 'text-slate-200'
        : 'text-slate-700',
  );

  return (
    <>
      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close navigation menu overlay"
            className="fixed inset-0 z-[70] bg-black/35"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            id="overlay-main-menu"
            aria-label="Site navigation"
            className={cn(
              'fixed inset-y-0 left-0 z-[80] flex h-screen w-[22rem] max-w-[88vw] flex-col overflow-hidden border-r p-4 shadow-lg motion-reduce:transition-none',
              drawerBorder,
              drawerBg,
              drawerText,
            )}>
            <AppMenuHeader
              title="Workout Tracker"
              onClose={() => setMenuOpen(false)}
              className={cn('border-b', drawerBorder)}
              titleClassName={drawerText}
              closeButtonClassName={closeBtnDrawer}
            />
            <div
              ref={menuScrollRef}
              id="overlay-main-menu-scroll"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] pr-1">
              <section className="mb-4">
                <h2
                  className={cn(
                    'mb-2 text-xs font-semibold uppercase tracking-wide',
                    subMuted,
                  )}>
                  Navigation
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {me ? (
                    <>
                      <NavLinkButton
                        to="/"
                        className={navLinkDrawer}
                        activeClassName={navActiveDrawer}
                        onClick={() => setMenuOpen(false)}>
                        Workouts
                      </NavLinkButton>
                      <NavLinkButton
                        to="/exercises"
                        className={navLinkDrawer}
                        activeClassName={navActiveDrawer}
                        onClick={() => setMenuOpen(false)}>
                        Exercises
                      </NavLinkButton>
                      <NavLinkButton
                        to="/dashboard"
                        className={navLinkDrawer}
                        activeClassName={navActiveDrawer}
                        onClick={() => setMenuOpen(false)}>
                        Dashboard
                      </NavLinkButton>
                      <NavLinkButton
                        to="/profile"
                        className={navLinkDrawer}
                        activeClassName={navActiveDrawer}
                        onClick={() => setMenuOpen(false)}>
                        Profile
                      </NavLinkButton>
                      <NavLinkButton
                        to="/about"
                        className={navLinkDrawer}
                        activeClassName={navActiveDrawer}
                        onClick={() => setMenuOpen(false)}>
                        About
                      </NavLinkButton>
                    </>
                  ) : (
                    <>
                      <NavLinkButton
                        to="/sign-in"
                        className={navLinkDrawer}
                        activeClassName={navActiveDrawer}
                        onClick={() => setMenuOpen(false)}>
                        Sign in
                      </NavLinkButton>
                      <NavLinkButton
                        to="/about"
                        className={navLinkDrawer}
                        activeClassName={navActiveDrawer}
                        onClick={() => setMenuOpen(false)}>
                        About
                      </NavLinkButton>
                    </>
                  )}
                </div>
              </section>

              <section
                className={cn(
                  'mb-4 rounded-lg border p-3',
                  state.highContrast
                    ? 'border-slate-300 bg-slate-50'
                    : darkShell
                      ? 'border-slate-600 bg-slate-950/80'
                      : 'border-slate-200 bg-slate-50',
                )}>
                <h2
                  className={cn(
                    'mb-2 text-xs font-semibold uppercase tracking-wide',
                    subMuted,
                  )}>
                  Account
                </h2>
                {me ? (
                  <>
                    <div className="mb-3 flex items-center gap-3">
                      <div
                        className={cn(
                          'flex size-10 items-center justify-center rounded-full text-sm font-semibold',
                          state.highContrast
                            ? 'bg-slate-200 text-slate-900'
                            : darkShell
                              ? 'bg-slate-700 text-slate-100'
                              : 'bg-indigo-100 text-indigo-700',
                        )}>
                        {(me.displayName ?? '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className={cn('text-sm font-semibold', drawerText)}>
                          {me.displayName}
                        </p>
                        <p className={cn('text-xs', subMuted)}>
                          {me.isGuest ? 'Guest' : 'Signed in'}
                        </p>
                      </div>
                    </div>
                    {me.isGuest ? (
                      <p className="mb-4 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
                        Guest session
                      </p>
                    ) : null}
                    <Button
                      variant="ghost"
                      className={cn(
                        'min-h-11 w-full justify-start border px-3 py-2 text-left text-base font-semibold',
                        state.highContrast
                          ? 'border-slate-300 bg-white text-slate-800'
                          : darkShell
                            ? 'border-slate-500 bg-slate-800 text-slate-100'
                            : 'border-slate-300 bg-white text-slate-800',
                      )}
                      onClick={() => {
                        setMenuOpen(false);
                        void signOut();
                      }}>
                      Sign out
                    </Button>
                  </>
                ) : (
                  <p className={cn('text-sm', subMuted)}>
                    Sign in to save data across devices.
                  </p>
                )}
              </section>
            </div>
          </aside>
        </>
      ) : null}

      <header
        className={cn(
          'sticky top-0 z-40 -mx-6 mb-6 border-b px-6 py-3 backdrop-blur',
          navHeaderBorder,
          navBackdrop,
        )}>
        <nav className="flex flex-row items-center justify-between gap-3">
          <span className={cn('text-base font-semibold', drawerText)}>
            Workout Tracker
          </span>
          <Button
            variant="ghost"
            className={menuBtnClass}
            aria-expanded={menuOpen}
            aria-controls="overlay-main-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-6"
                  aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6l12 12M6 18L18 6"
                  />
                </svg>
                <span>Close</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-6"
                  aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7h16M4 12h16M4 17h16"
                  />
                </svg>
                <span>Menu</span>
              </>
            )}
          </Button>
        </nav>
      </header>
    </>
  );
}

/**
 * App shell: auth-aware navigation and workout routes.
 */
export default function App() {
  const state = useAppState();
  const systemDark = useSystemPrefersDark();
  const mainClassName = useMemo(
    () => mainLayoutClassNames(state.highContrast, state.themeMode, systemDark),
    [state.highContrast, state.themeMode, systemDark],
  );

  useEffect(() => {
    syncDocumentElementDisplayShell(
      document.documentElement,
      state,
      systemDark,
    );
  }, [state, systemDark]);

  return (
    <AuthProvider>
      <main className={mainClassName}>
        <AppShellNav />
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
